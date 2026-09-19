// Package main demonstrates a small backend-owned AI agent in Go.
//
// Run:
//   export OPENAI_API_KEY="..."
//   go run agent_server.go
//
// The server uses the OpenAI-compatible Chat Completions tool-calling
// contract. Set OPENAI_BASE_URL to use another compatible provider.
package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
	"unicode/utf8"
)

const (
	defaultBaseURL = "https://api.openai.com/v1"
	defaultModel   = "gpt-4.1-mini"
	maxSteps       = 4
)

type AgentRequest struct {
	Prompt         string `json:"prompt"`
	IdempotencyKey string `json:"idempotency_key"`
}

type AgentResponse struct {
	RunID   string `json:"run_id"`
	Status  string `json:"status"`
	Answer  string `json:"answer,omitempty"`
	Message string `json:"message,omitempty"`
}

type ChatMessage struct {
	Role       string     `json:"role"`
	Content    string     `json:"content,omitempty"`
	Name       string     `json:"name,omitempty"`
	ToolCallID string     `json:"tool_call_id,omitempty"`
	ToolCalls  []ToolCall `json:"tool_calls,omitempty"`
}

type ToolCall struct {
	ID       string       `json:"id"`
	Type     string       `json:"type"`
	Function ToolFunction `json:"function"`
}

type ToolFunction struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"`
}

type ChatCompletionRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
	Tools    []Tool       `json:"tools,omitempty"`
}

type ChatCompletionResponse struct {
	Choices []struct {
		Message ChatMessage `json:"message"`
	} `json:"choices"`
}

type Tool struct {
	Type     string       `json:"type"`
	Function ToolSpec `json:"function"`
}

type ToolSpec struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Parameters  map[string]any `json:"parameters"`
}

type Agent struct {
	APIKey     string
	BaseURL    string
	Model      string
	HTTPClient *http.Client
}

func (a *Agent) Run(ctx context.Context, prompt, userID, tenantID string) (string, error) {
	messages := []ChatMessage{
		{
			Role: "system",
			Content: "You are a support agent. Use tools for facts. Never invent order status. Keep answers concise.",
		},
		{Role: "user", Content: prompt},
	}

	for step := 0; step < maxSteps; step++ {
		response, err := a.complete(ctx, messages)
		if err != nil {
			return "", err
		}
		if len(response.Choices) == 0 {
			return "", errors.New("model returned no choices")
		}

		assistant := response.Choices[0].Message
		messages = append(messages, assistant)
		if len(assistant.ToolCalls) == 0 {
			return assistant.Content, nil
		}

		for _, call := range assistant.ToolCalls {
			result, err := a.executeTool(call, userID, tenantID)
			if err != nil {
				result = map[string]any{"error": err.Error()}
			}
			encoded, marshalErr := json.Marshal(result)
			if marshalErr != nil {
				return "", fmt.Errorf("marshal tool result: %w", marshalErr)
			}
			messages = append(messages, ChatMessage{
				Role:       "tool",
				ToolCallID: call.ID,
				Content:    string(encoded),
			})
		}
	}

	return "", errors.New("agent step limit exceeded")
}

func (a *Agent) complete(ctx context.Context, messages []ChatMessage) (ChatCompletionResponse, error) {
	payload := ChatCompletionRequest{
		Model:    a.Model,
		Messages: messages,
		Tools: []Tool{{
			Type: "function",
			Function: ToolSpec{
				Name:        "get_order",
				Description: "Read an order visible to the authenticated tenant.",
				Parameters: map[string]any{
					"type": "object",
					"properties": map[string]any{
						"order_id": map[string]any{"type": "string"},
					},
					"required": []string{"order_id"},
				},
			},
		}},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return ChatCompletionResponse{}, fmt.Errorf("marshal completion request: %w", err)
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(a.BaseURL, "/")+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return ChatCompletionResponse{}, fmt.Errorf("create completion request: %w", err)
	}
	request.Header.Set("Authorization", "Bearer "+a.APIKey)
	request.Header.Set("Content-Type", "application/json")

	response, err := a.HTTPClient.Do(request)
	if err != nil {
		return ChatCompletionResponse{}, fmt.Errorf("call model: %w", err)
	}
	defer response.Body.Close()
	responseBody, err := io.ReadAll(io.LimitReader(response.Body, 2<<20))
	if err != nil {
		return ChatCompletionResponse{}, fmt.Errorf("read model response: %w", err)
	}
	if response.StatusCode/100 != 2 {
		return ChatCompletionResponse{}, fmt.Errorf("model returned HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(responseBody)))
	}

	var completion ChatCompletionResponse
	if err := json.Unmarshal(responseBody, &completion); err != nil {
		return ChatCompletionResponse{}, fmt.Errorf("decode model response: %w", err)
	}
	return completion, nil
}

func (a *Agent) executeTool(call ToolCall, userID, tenantID string) (map[string]any, error) {
	if userID == "" || tenantID == "" {
		return nil, errors.New("authenticated identity is required")
	}
	if call.Function.Name != "get_order" {
		return nil, fmt.Errorf("unsupported tool %q", call.Function.Name)
	}

	var args struct {
		OrderID string `json:"order_id"`
	}
	if err := json.Unmarshal([]byte(call.Function.Arguments), &args); err != nil {
		return nil, fmt.Errorf("invalid get_order arguments: %w", err)
	}
	if args.OrderID == "" {
		return nil, errors.New("order_id is required")
	}

	// Replace this fixture with a repository call that enforces tenant scope.
	return map[string]any{
		"order_id": args.OrderID,
		"status":   "shipped",
		"eta":      "2026-09-21",
	}, nil
}

func main() {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		log.Fatal("OPENAI_API_KEY is required")
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}

	agent := &Agent{
		APIKey:     apiKey,
		BaseURL:    envOr("OPENAI_BASE_URL", defaultBaseURL),
		Model:      envOr("OPENAI_MODEL", defaultModel),
		HTTPClient: &http.Client{Timeout: 45 * time.Second},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /agent-runs", func(response http.ResponseWriter, request *http.Request) {
		claims, err := verifyBearerJWT(request.Header.Get("Authorization"), jwtSecret)
		if err != nil {
			writeJSON(response, http.StatusUnauthorized, AgentResponse{Status: "failed", Message: "invalid authorization"})
			return
		}

		var input AgentRequest
		if err := json.NewDecoder(io.LimitReader(request.Body, 1<<20)).Decode(&input); err != nil ||
			strings.TrimSpace(input.Prompt) == "" || !validLength(input.Prompt, 1, 4000) {
			writeJSON(response, http.StatusBadRequest, AgentResponse{Status: "failed", Message: "prompt is required"})
			return
		}
		if !validLength(input.IdempotencyKey, 8, 100) {
			writeJSON(response, http.StatusBadRequest, AgentResponse{Status: "failed", Message: "idempotency_key is required"})
			return
		}

		ctx, cancel := context.WithTimeout(request.Context(), 60*time.Second)
		defer cancel()
		answer, err := agent.Run(ctx, input.Prompt, claims.Subject, claims.TenantID)
		if err != nil {
			log.Printf("agent run failed: %v", err)
			writeJSON(response, http.StatusBadGateway, AgentResponse{Status: "failed", Message: "agent execution failed"})
			return
		}
		writeJSON(response, http.StatusOK, AgentResponse{
			RunID:  input.IdempotencyKey,
			Status: "succeeded",
			Answer: answer,
		})
	})

	server := &http.Server{Addr: ":8080", Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	log.Println("agent API listening on http://localhost:8080")
	log.Fatal(server.ListenAndServe())
}

type jwtClaims struct {
	Subject  string `json:"sub"`
	TenantID string `json:"tenant_id"`
	Expires  int64  `json:"exp"`
}

func verifyBearerJWT(header, secret string) (jwtClaims, error) {
	parts := strings.Fields(header)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return jwtClaims{}, errors.New("bearer token required")
	}
	segments := strings.Split(parts[1], ".")
	if len(segments) != 3 {
		return jwtClaims{}, errors.New("invalid JWT format")
	}
	encodedHeader, encodedPayload, encodedSignature := segments[0], segments[1], segments[2]
	headerBytes, err := base64.RawURLEncoding.DecodeString(encodedHeader)
	if err != nil {
		return jwtClaims{}, errors.New("invalid JWT header")
	}
	var tokenHeader struct{ Algorithm string `json:"alg"` }
	if err := json.Unmarshal(headerBytes, &tokenHeader); err != nil || tokenHeader.Algorithm != "HS256" {
		return jwtClaims{}, errors.New("unsupported JWT algorithm")
	}
	providedSignature, err := base64.RawURLEncoding.DecodeString(encodedSignature)
	if err != nil {
		return jwtClaims{}, errors.New("invalid JWT signature")
	}
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(encodedHeader + "." + encodedPayload))
	if !hmac.Equal(providedSignature, mac.Sum(nil)) {
		return jwtClaims{}, errors.New("JWT signature verification failed")
	}
	payloadBytes, err := base64.RawURLEncoding.DecodeString(encodedPayload)
	if err != nil {
		return jwtClaims{}, errors.New("invalid JWT payload")
	}
	var claims jwtClaims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil || claims.Subject == "" || claims.TenantID == "" {
		return jwtClaims{}, errors.New("JWT identity claims are required")
	}
	if claims.Expires <= time.Now().Unix() {
		return jwtClaims{}, errors.New("JWT is expired")
	}
	return claims, nil
}

func validLength(value string, min, max int) bool {
	length := utf8.RuneCountInString(value)
	return length >= min && length <= max
}

func envOr(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func writeJSON(response http.ResponseWriter, status int, value any) {
	response.Header().Set("Content-Type", "application/json")
	response.WriteHeader(status)
	if err := json.NewEncoder(response).Encode(value); err != nil {
		log.Printf("write response: %v", err)
	}
}
