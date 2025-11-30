from behave import given, when, then
import os
import time
from deckbot.manager import PresentationManager
from deckbot.tools import PresentationTools
from unittest.mock import MagicMock

@given('I create a directory "{dirname}" in "{pres_name}"')
def step_impl(context, dirname, pres_name):
    path = os.path.join(context.temp_dir, pres_name, dirname)
    os.makedirs(path, exist_ok=True)

@given('I create a file "{filename}" in "{pres_name}"')
def step_impl(context, filename, pres_name):
    path = os.path.join(context.temp_dir, pres_name, filename)
    with open(path, 'w') as f:
        f.write("content")

@given('I wait {seconds} second')
def step_impl(context, seconds):
    time.sleep(float(seconds))

@when('the agent lists files in "{directory}"')
def step_impl(context, directory):
    manager = PresentationManager(root_dir=context.temp_dir)
    pres_name = "DraftsTest" 
    context.presentation_context = manager.get_presentation(pres_name)
    
    tools = PresentationTools(context.presentation_context, MagicMock(), root_dir=context.temp_dir)
    context.file_list_output = tools.list_files(directory)

@then('the list should start with "{filename}"')
def step_impl(context, filename):
    lines = context.file_list_output.strip().split('\n')
    if not lines or lines[0] == "Directory is empty.":
        assert False, "List is empty"
    assert lines[0] == filename, f"Expected {filename} first, got {lines[0]}"

@then('the list should contain "{filename}" after "{prev_filename}"')
def step_impl(context, filename, prev_filename):
    lines = context.file_list_output.strip().split('\n')
    try:
        idx_prev = lines.index(prev_filename)
        idx_curr = lines.index(filename)
        assert idx_curr > idx_prev, f"Expected {filename} after {prev_filename}, but found at {idx_curr} vs {idx_prev}"
    except ValueError as e:
        assert False, f"File not found in list: {e}. List: {lines}"
