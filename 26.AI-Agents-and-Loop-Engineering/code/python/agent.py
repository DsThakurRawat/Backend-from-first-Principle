"""
A small LangGraph agent with one read-only backend tool.

Run:
    pip install langgraph langchain-openai typing-extensions
    export OPENAI_API_KEY="..."
    python agent.py

The tool implementation is intentionally local. Replace get_order with a
repository call that applies authentication and tenant scoping in production.
"""

from typing import Annotated, Literal

from typing_extensions import TypedDict
from langchain_core.messages import (
    AnyMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    user_id: str
    tenant_id: str
    steps: int


@tool
def get_order(order_id: str) -> dict:
    """Read an order visible to the authenticated tenant."""
    # Replace this fixture with a repository query that enforces tenant scope.
    return {"order_id": order_id, "status": "shipped", "eta": "2026-09-21"}


model = ChatOpenAI(model="gpt-4.1-mini", temperature=0)
model_with_tools = model.bind_tools([get_order])


def call_model(state: AgentState) -> dict:
    response = model_with_tools.invoke([
        SystemMessage(content=(
            "You are a support agent. Use tools for facts. "
            "Never invent order status. Keep the answer concise."
        )),
        *state["messages"],
    ])
    return {"messages": [response], "steps": state["steps"] + 1}


def run_tools(state: AgentState) -> dict:
    last = state["messages"][-1]
    tool_messages = []
    for call in last.tool_calls:
        if call["name"] == "get_order":
            result = get_order.invoke(call["args"])
            content = str(result)
        else:
            content = f"Unsupported tool: {call['name']}"
        tool_messages.append(ToolMessage(
            content=content,
            tool_call_id=call["id"],
        ))
    return {"messages": tool_messages}


def route_after_model(state: AgentState) -> Literal["tools", "done"]:
    last = state["messages"][-1]
    if getattr(last, "tool_calls", None) and state["steps"] < 4:
        return "tools"
    return "done"


def build_agent():
    graph = StateGraph(AgentState)
    graph.add_node("model", call_model)
    graph.add_node("tools", run_tools)
    graph.add_edge(START, "model")
    graph.add_conditional_edges(
        "model",
        route_after_model,
        {"tools": "tools", "done": END},
    )
    graph.add_edge("tools", "model")
    return graph.compile()


if __name__ == "__main__":
    agent = build_agent()
    result = agent.invoke({
        "messages": [HumanMessage(content="Where is order A-42?")],
        "user_id": "user-7",
        "tenant_id": "tenant-3",
        "steps": 0,
    })
    print(result["messages"][-1].content)
