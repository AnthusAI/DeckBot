import os
import sys
import platform


def get_bundled_node_path():
    """Get path to bundled Node.js executable in Electron app."""
    if getattr(sys, 'frozen', False):
        # Running in PyInstaller bundle (Electron app)
        base_path = sys._MEIPASS

        if platform.system() == 'Darwin':
            return os.path.join(base_path, '..', 'nodejs', 'bin', 'node')
        elif platform.system() == 'Windows':
            return os.path.join(base_path, '..', 'nodejs', 'node.exe')
        else:
            # Linux (if needed in future)
            return os.path.join(base_path, '..', 'nodejs', 'bin', 'node')
    else:
        # Development mode: use system Node.js
        return 'node'


def get_bundled_npx_path():
    """Get path to bundled npx in Electron app."""
    if getattr(sys, 'frozen', False):
        # Running in PyInstaller bundle (Electron app)
        base_path = sys._MEIPASS

        if platform.system() == 'Darwin':
            return os.path.join(base_path, '..', 'nodejs', 'bin', 'npx')
        elif platform.system() == 'Windows':
            return os.path.join(base_path, '..', 'nodejs', 'npx.cmd')
        else:
            # Linux (if needed in future)
            return os.path.join(base_path, '..', 'nodejs', 'bin', 'npx')
    else:
        # Development mode: use system npx
        return 'npx'


def get_marp_command(*args):
    """
    Build Marp CLI command with bundled Node.js.

    Args:
        *args: Arguments to pass to Marp CLI (e.g., input_file, '-o', output_file)

    Returns:
        list: Command array ready for subprocess.run()
    """
    npx = get_bundled_npx_path()
    return [npx, '@marp-team/marp-cli'] + list(args)


def is_running_in_electron():
    """Check if we're running inside the Electron app."""
    return getattr(sys, 'frozen', False)
