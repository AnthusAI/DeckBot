from behave import given, when, then
import os
import json

@given('the presentation has chat history with text messages')
def step_impl(context):
    pres_name = "history-display-test"
    history_file = os.path.join(context.temp_dir, pres_name, "chat_history.jsonl")
    
    messages = [
        {"role": "user", "content": "Create a slide about AI"},
        {"role": "model", "content": "I'll create a slide for you about AI."}
    ]
    
    with open(history_file, 'w') as f:
        for msg in messages:
            f.write(json.dumps(msg) + "\n")
    
    context.expected_text_count = 2

@given('the presentation has chat history with tool calls')
def step_impl(context):
    pres_name = "tool-history-test"
    history_file = os.path.join(context.temp_dir, pres_name, "chat_history.jsonl")
    
    messages = [
        {"role": "user", "content": "Write a file"},
        {"role": "model", "parts": [{"function_call": {"name": "write_file", "args": {"filename": "test.md", "content": "# Test"}}}]},
        {"role": "tool", "parts": [{"function_response": {"name": "write_file", "response": {"result": "Success"}}}]},
        {"role": "model", "content": "File created successfully"}
    ]
    
    with open(history_file, 'w') as f:
        for msg in messages:
            f.write(json.dumps(msg) + "\n")

@given('the presentation has chat history with:')
def step_impl(context):
    pres_name = "mixed-history-test"
    history_file = os.path.join(context.temp_dir, pres_name, "chat_history.jsonl")
    
    messages = []
    for row in context.table:
        msg_type = row['type']
        content = row['content']
        
        if msg_type == 'text':
            messages.append({"role": "user", "content": content})
        elif msg_type == 'function_call':
            messages.append({"role": "model", "parts": [{"function_call": {"name": content, "args": {}}}]})
        elif msg_type == 'function_response':
            messages.append({"role": "tool", "parts": [{"function_response": {"name": "write_file", "response": {"result": content}}}]})
    
    with open(history_file, 'w') as f:
        for msg in messages:
            f.write(json.dumps(msg) + "\n")
    
    context.expected_entries = len(messages)

@then('the history should include the previous text messages')
def step_impl(context):
    # Check the response data
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    
    # Count text messages
    text_messages = [msg for msg in history if any(
        part.get('text') for part in msg.get('parts', [])
    ) or msg.get('content')]
    
    assert len(text_messages) >= 1, f"Expected at least 1 text message in history, found {len(text_messages)}"

@then('the history should include function_call parts')
def step_impl(context):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    
    function_calls = [msg for msg in history if any(
        'function_call' in part for part in msg.get('parts', [])
    )]
    
    assert len(function_calls) >= 1, f"Expected at least 1 function_call in history, found {len(function_calls)}"

@then('the history should include function_response parts')
def step_impl(context):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    
    function_responses = [msg for msg in history if any(
        'function_response' in part for part in msg.get('parts', [])
    )]
    
    assert len(function_responses) >= 1, f"Expected at least 1 function_response in history, found {len(function_responses)}"

@then('the response should contain all history entries')
def step_impl(context):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    assert len(history) >= context.expected_entries, f"Expected {context.expected_entries} history entries, found {len(history)}"

@then('text messages should be displayed')
def step_impl(context):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    # At least one entry should have text content
    has_text = any(
        msg.get('content') or any(part.get('text') for part in msg.get('parts', []))
        for msg in history
    )
    assert has_text, "No text messages found in history"

@then('function calls should be represented')
def step_impl(context):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    has_function_call = any(
        any('function_call' in part for part in msg.get('parts', []))
        for msg in history
    )
    assert has_function_call, "No function calls found in history"

@then('function responses should be included in history data')
def step_impl(context):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    has_function_response = any(
        any('function_response' in part for part in msg.get('parts', []))
        for msg in history
    )
    assert has_function_response, "No function responses found in history"

# Rich message type steps

@given('the presentation has an image request in chat history')
def step_impl(context):
    pres_name = "image-history-test"
    history_file = os.path.join(context.temp_dir, pres_name, "chat_history.jsonl")
    
    message = {
        "role": "system",
        "message_type": "image_request_details",
        "timestamp": "2024-11-30T12:00:00Z",
        "data": {
            "user_message": "a blue robot",
            "system_message": "Create a photorealistic image...",
            "aspect_ratio": "16:9",
            "resolution": "2K",
            "batch_slug": "blue-robot-12345"
        }
    }
    
    with open(history_file, 'w') as f:
        f.write(json.dumps(message) + "\n")

@given('the presentation has 4 image candidates in chat history')
def step_impl(context):
    pres_name = "image-candidates-test"
    history_file = os.path.join(context.temp_dir, pres_name, "chat_history.jsonl")
    
    with open(history_file, 'w') as f:
        for i in range(4):
            message = {
                "role": "system",
                "message_type": "image_candidate",
                "timestamp": f"2024-11-30T12:00:0{i}Z",
                "data": {
                    "image_path": f"drafts/batch-123/candidate_{i}.png",
                    "index": i,
                    "batch_slug": "batch-123"
                }
            }
            f.write(json.dumps(message) + "\n")

@given('the presentation has image candidates in chat history')
def step_impl(context):
    pres_name = "image-selection-test"
    history_file = os.path.join(context.temp_dir, pres_name, "chat_history.jsonl")
    
    with open(history_file, 'w') as f:
        # Add candidates
        for i in range(4):
            message = {
                "role": "system",
                "message_type": "image_candidate",
                "timestamp": f"2024-11-30T12:00:0{i}Z",
                "data": {
                    "image_path": f"drafts/batch-456/candidate_{i}.png",
                    "index": i,
                    "batch_slug": "batch-456"
                }
            }
            f.write(json.dumps(message) + "\n")

@given('the presentation has an image selection in chat history')
def step_impl(context):
    pres_name = "image-selection-test"
    history_file = os.path.join(context.temp_dir, pres_name, "chat_history.jsonl")
    
    message = {
        "role": "system",
        "message_type": "image_selection",
        "timestamp": "2024-11-30T12:01:00Z",
        "data": {
            "index": 2,
            "batch_slug": "batch-456",
            "filename": "robot_1.png",
            "saved_path": "images/robot_1.png"
        }
    }
    
    with open(history_file, 'a') as f:
        f.write(json.dumps(message) + "\n")

@given('the presentation has an agent request in chat history')
def step_impl(context):
    pres_name = "agent-request-test"
    history_file = os.path.join(context.temp_dir, pres_name, "chat_history.jsonl")
    
    message = {
        "role": "user",
        "message_type": "agent_request_details",
        "timestamp": "2024-11-30T12:05:00Z",
        "content": "Create a slide about robots",
        "data": {
            "user_message": "Create a slide about robots",
            "system_prompt": "You are DeckBot, an AI presentation assistant...",
            "model": "gemini-2.0-flash-exp"
        }
    }
    
    with open(history_file, 'w') as f:
        f.write(json.dumps(message) + "\n")

@then('the history should include image_request_details message type')
def step_impl(context):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    
    has_request = any(msg.get('message_type') == 'image_request_details' for msg in history)
    assert has_request, "No image_request_details found in history"

@then('the image request should have {field} data')
def step_impl(context, field):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    
    request = next((msg for msg in history if msg.get('message_type') == 'image_request_details'), None)
    assert request, "No image_request_details found"
    assert field in request.get('data', {}), f"Field '{field}' not found in image request data"

@then('the history should include {count:d} image_candidate message types')
def step_impl(context, count):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    
    candidates = [msg for msg in history if msg.get('message_type') == 'image_candidate']
    assert len(candidates) == count, f"Expected {count} image candidates, found {len(candidates)}"

@then('each candidate should have {field} data')
def step_impl(context, field):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    
    candidates = [msg for msg in history if msg.get('message_type') == 'image_candidate']
    for candidate in candidates:
        assert field in candidate.get('data', {}), f"Field '{field}' not found in candidate data"

@then('the history should include image_selection message type')
def step_impl(context):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    
    has_selection = any(msg.get('message_type') == 'image_selection' for msg in history)
    assert has_selection, "No image_selection found in history"

@then('the selection should have {field} data')
def step_impl(context, field):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    
    selection = next((msg for msg in history if msg.get('message_type') == 'image_selection'), None)
    assert selection, "No image_selection found"
    assert field in selection.get('data', {}), f"Field '{field}' not found in selection data"

@then('the history should include agent_request_details message type')
def step_impl(context):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    
    has_request = any(msg.get('message_type') == 'agent_request_details' for msg in history)
    assert has_request, "No agent_request_details found in history"

@then('the agent request should have {field} data')
def step_impl(context, field):
    response_data = json.loads(context.response.get_data(as_text=True))
    history = response_data.get('history', [])
    
    request = next((msg for msg in history if msg.get('message_type') == 'agent_request_details'), None)
    assert request, "No agent_request_details found"
    assert field in request.get('data', {}), f"Field '{field}' not found in agent request data"

