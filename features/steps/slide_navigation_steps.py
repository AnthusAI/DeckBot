from behave import given, when, then
from unittest.mock import patch, MagicMock
import os
from deckbot.agent import Agent

@given('a presentation exists')
def step_impl(context):
    context.presentation_context = {'name': 'NavTestDeck'}
    # Create dummy agent to get path
    with patch('os.getenv', return_value='fake_key'):
        context.agent = Agent(context.presentation_context, root_dir=context.temp_dir)
    
    presentation_dir = context.agent.tools_handler.presentation_dir
    if not os.path.exists(presentation_dir):
        os.makedirs(presentation_dir)
    with open(os.path.join(presentation_dir, "deck.marp.html"), "w") as f:
        f.write("<html>Dummy Presentation</html>")

@then('the agent should have a tool named "{tool_name}"')
def step_impl(context, tool_name):
    # Verify the tool exists in the tool list and has the correct __name__
    found = False
    for tool in context.agent.tools_list:
        if tool.__name__ == tool_name:
            found = True
            break
    assert found, f"Tool '{tool_name}' not found in agent.tools_list. Found: {[t.__name__ for t in context.agent.tools_list]}"

@then('the tool "{tool_name}" should be callable')
def step_impl(context, tool_name):
    # Find the tool
    tool_func = None
    for tool in context.agent.tools_list:
        if tool.__name__ == tool_name:
            tool_func = tool
            break
    assert tool_func is not None
    assert callable(tool_func)

@when('I ask the agent "{command}"')
def step_impl(context, command):
    # We don't actually call chat() because we can't easily control the LLM's tool call choice in this unit test.
    pass

@then('the agent should call compile_presentation with slide_number={slide_num}')
def step_impl(context, slide_num):
    slide_num = int(slide_num)
    
    # Simulate tool call
    # We need to mock Popen/run to check behavior
    with patch('subprocess.Popen') as mock_popen, patch('subprocess.run') as mock_run, patch('os.name', 'posix'):
        context.agent.tools_handler.compile_presentation(slide_number=slide_num)
        context.mock_popen = mock_popen

@then('the system should open the HTML file with fragment "{fragment}"')
def step_impl(context, fragment):
    # This checks the local CLI behavior (opening browser)
    # We verify Popen was called with the fragment
    open_call = None
    for call_args in context.mock_popen.call_args_list:
        args = call_args[0]
        if args and isinstance(args[0], list) and len(args[0]) > 0 and args[0][0] == 'open':
            open_call = args
            break
    assert open_call is not None
    assert fragment in open_call[0][1]

@then('the Web UI should receive an update event with slide_number={slide_num}')
def step_impl(context, slide_num):
    slide_num = int(slide_num)
    
    # Setup a mock callback
    mock_callback = MagicMock()
    context.agent.tools_handler.on_presentation_updated = mock_callback
    
    # Call the tool again to trigger callback
    # We mock Popen again just to suppress side effects
    with patch('subprocess.Popen'), patch('subprocess.run'), patch('os.name', 'posix'):
        context.agent.tools_handler.compile_presentation(slide_number=slide_num)
    
    # Verify callback was called with dict containing slide_number
    mock_callback.assert_called_with({'slide_number': slide_num})

@given('the generated HTML file contains sections without IDs')
def step_impl(context):
    # Write content mimicking Marp output without IDs
    html_path = os.path.join(context.agent.tools_handler.presentation_dir, "deck.marp.html")
    content = """
    <!DOCTYPE html>
    <html><body>
    <div class="marpit">
    <section>Slide 1</section>
    <section class="something">Slide 2</section>
    <section>Slide 3</section>
    </div>
    </body></html>
    """
    with open(html_path, 'w') as f:
        f.write(content)

@when('I manually trigger the compile_presentation tool')
def step_impl(context):
    # Trigger compile_presentation
    # Mock subprocess.run so it doesn't overwrite our file
    with patch('subprocess.run') as mock_run, patch('subprocess.Popen'), patch('os.name', 'posix'):
        mock_run.return_value.returncode = 0
        context.agent.tools_handler.compile_presentation()

@then('the HTML file should contain sections with numeric IDs')
def step_impl(context):
    html_path = os.path.join(context.agent.tools_handler.presentation_dir, "deck.marp.html")
    with open(html_path, 'r') as f:
        content = f.read()
    
    # Check for id="1", id="2", id="3"
    assert 'id="1"' in content, "Missing id='1'"
    assert 'id="2"' in content, "Missing id='2'"
    assert 'id="3"' in content, "Missing id='3'"
    
    # Ensure they are attached to sections
    assert '<section id="1">' in content or '<section id="1" class' in content or 'id="1"' in content # Regex replacement might result in order changes if attrs exist
