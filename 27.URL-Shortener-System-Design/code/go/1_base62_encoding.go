package shortener

import (
	"fmt"
	"strings"
)

// Base62 character set [0-9, a-z, A-Z]
const base62Chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const base = 62

// Encode converts a decimal ID to base62 string
// Example: Encode(123456789) -> "8m0kx"
func Encode(num int64) string {
	if num == 0 {
		return "0"
	}

	var result []byte
	for num > 0 {
		result = append(result, base62Chars[num%base])
		num /= base
	}

	// Reverse the result (we built it backwards)
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}

	return string(result)
}

// Decode converts a base62 string back to decimal ID
// Example: Decode("8m0kx") -> 123456789
func Decode(code string) int64 {
	var result int64 = 0

	for _, char := range code {
		idx := strings.IndexRune(base62Chars, char)
		if idx == -1 {
			return 0 // invalid character
		}

		result = result*base + int64(idx)
	}

	return result
}

// Codepoints shows how many unique codes we can generate with N characters
// Example: Codepoints(6) -> 62^6 = 56,800,235,584
func Codepoints(length int) int64 {
	result := int64(1)
	for i := 0; i < length; i++ {
		result *= base
	}
	return result
}

// Example usage and tests
func ExampleEncodeDecode() {
	testCases := []int64{
		0,
		1,
		61,  // Last single-digit base62
		62,  // First two-digit base62
		123456789,
		999999999,
	}

	for _, num := range testCases {
		encoded := Encode(num)
		decoded := Decode(encoded)
		fmt.Printf("ID: %d -> Code: %s -> ID: %d (match: %v)\n", 
			num, encoded, decoded, num == decoded)
	}
}
