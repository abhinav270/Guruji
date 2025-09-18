"""
Pydantic models for the FastAPI MCP Server.

This file contains all the data models for custom endpoints,
session management, and agent/tool discovery.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Internal Data Structures for Custom Session Management ---

class ToolCall(BaseModel):
    """Model for a tool call made by an agent."""
    tool: str
    args: Dict[str, Any]
    result: Optional[str] = None

class Message(BaseModel):
    """Model for a single message in the chat history."""
    role: str  # "user" or "assistant"
    content: str
    agent_used: Optional[str] = None
    tool_calls: List[ToolCall] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# --- API Request/Response Models for Custom Endpoints ---

class NewSessionResponse(BaseModel):
    """Response for creating a new session."""
    session_id: str
    created_at: datetime

class ChatRequest(BaseModel):
    """Request model for the /chat endpoint."""
    session_id: str
    message: str
    agent: Optional[str] = None

class ChatResponse(BaseModel):
    """Response model for the /chat endpoint."""
    reply: str
    agent_used: str
    tool_calls: List[ToolCall] = []
    timestamp: datetime

class HistoryResponse(BaseModel):
    """Response model for the /history/{session_id} endpoint."""
    session_id: str
    history: List[Message]

# --- Agent and Tool Discovery Models ---

class AgentDetail(BaseModel):
    """Model for describing an agent."""
    name: str
    description: str
    system_prompt: str

class AgentsListResponse(BaseModel):
    """Response model for listing available agents."""
    agents: List[AgentDetail]

class ToolDetail(BaseModel):
    """Model for describing a tool."""
    tool_name: str
    description: str
    schema_: Dict[str, Any] = Field(..., alias="schema")

class ToolsListResponse(BaseModel):
    """Response model for listing available tools."""
    tools: List[ToolDetail]
