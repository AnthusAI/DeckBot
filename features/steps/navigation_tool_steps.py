from behave import given, when, then
from unittest.mock import patch, MagicMock
import os
from deckbot.agent import Agent

# --- Shared Steps ---

@given('a compiled presentation exists')
def step_impl(context):
    context.presentation_context = {'name': 'NavToolTestDeck'}
    with patch('os.getenv', return_value='fake_key'):
        context.agent = Agent(context.presentation_context, root_dir=context.temp_dir)
    
    presentation_dir = context.agent.tools_handler.presentation_dir
    if not os.path.exists(presentation_dir):
        os.makedirs(presentation_dir)
    
    with open(os.path.join(presentation_dir, "deck.marp.html"), "w") as f:
        f.write("<html><section id='1'></section><section id='2'></section><section id='3'></section></html>")

@when('the agent uses the "go_to_slide" tool with slide_number={slide_num} in CLI mode')
def step_impl(context, slide_num):
    slide_num = int(slide_num)
    
    # Ensure NO listener
    context.agent.tools_handler.on_presentation_updated = None
    
    with patch('subprocess.Popen') as mock_popen, \
         patch('subprocess.run') as mock_run, \
         patch('os.name', 'posix'):
        
        result = context.agent.tools_handler.go_to_slide(slide_number=slide_num)
        context.tool_result = result
        context.mock_popen = mock_popen
        context.mock_run = mock_run

@when('the agent uses the "go_to_slide" tool with slide_number={slide_num} in Web mode')
def step_impl(context, slide_num):
    slide_num = int(slide_num)
    
    # Set listener
    mock_callback = MagicMock()
    context.agent.tools_handler.on_presentation_updated = mock_callback
    context.mock_callback = mock_callback
    
    with patch('subprocess.Popen') as mock_popen, \
         patch('subprocess.run') as mock_run, \
         patch('os.name', 'posix'):
        
        result = context.agent.tools_handler.go_to_slide(slide_number=slide_num)
        context.tool_result = result
        context.mock_popen = mock_popen
        context.mock_run = mock_run

@when('the agent uses the "go_to_slide" tool without arguments')
def step_impl(context):
    # Call without arguments
    with patch('subprocess.Popen') as mock_popen, \
         patch('subprocess.run') as mock_run:
        result = context.agent.tools_handler.go_to_slide()
        context.tool_result = result

@then('the tool should return an error message requesting a slide number')
def step_impl(context):
    assert "Error: slide_number is required" in context.tool_result

# --- Unique Steps for Navigation Tool Feature ---

@then('the system should open the HTML file with fragment "{fragment}" via go_to_slide')
def step_impl(context, fragment):
    open_call = None
    for call_args in context.mock_popen.call_args_list:
        args = call_args[0]
        if args and isinstance(args[0], list) and len(args[0]) > 0 and args[0][0] == 'open':
            open_call = args
            break
    assert open_call is not None, "System did not attempt to open the file"
    assert fragment in open_call[0][1], f"Fragment {fragment} not found in open URL: {open_call[0][1]}"

@then('no compilation should occur')
def step_impl(context):
    npx_called = False
    for call_args in context.mock_run.call_args_list:
        args = call_args[0]
        if args and isinstance(args[0], list) and args[0][0] == 'npx':
            npx_called = True
            break
    assert not npx_called, "Compilation (npx) was called but should not have been"
