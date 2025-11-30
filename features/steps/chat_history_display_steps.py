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

