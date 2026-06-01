@echo off
echo ===== OSINT Assistant Python Environment Diagnostic =====
echo.

REM Show Python environment information
echo PYTHON ENVIRONMENT INFORMATION:
echo ------------------------------
where python
python --version
echo.
echo Python executable path:
python -c "import sys; print(sys.executable)"
echo.
echo Python site-packages location:
python -c "import site; print(site.getsitepackages()[0])"
echo.

REM Try different pip installation methods
echo ATTEMPTING MULTIPLE INSTALLATION METHODS:
echo ------------------------------
echo Method 1: Standard pip install
pip install python-dotenv
echo.

echo Method 2: Specific Python executable
python -m pip install python-dotenv
echo.

echo Method 3: Using pip directly with --user flag
pip install --user python-dotenv
echo.

echo Method 4: Force reinstallation
pip install --force-reinstall python-dotenv
echo.

REM Verify installation
echo VERIFYING INSTALLATION:
echo ------------------------------
echo Checking if dotenv is now installed:
python -c "import importlib.util; print('python-dotenv is INSTALLED' if importlib.util.find_spec('dotenv') else 'python-dotenv is NOT installed')"
echo.

REM Run the actual application with error handling
echo TESTING OSINT ASSISTANT:
echo ------------------------------
echo Trying to run OSINT web app...
python -c "try: import dotenv; print('Successfully imported dotenv module.'); except ImportError as e: print(f'Error: {e}. Module still not installed correctly.')"
echo.

echo ==== TROUBLESHOOTING RECOMMENDATIONS ====
echo.
echo If the module is still not found:
echo 1. You may have multiple Python installations. Try using 'py' instead of 'python'
echo    py -m pip install python-dotenv
echo.
echo 2. Try installing with administrator privileges (Run Command Prompt as Administrator)
echo.
echo 3. If you're using Anaconda/virtual environments, make sure to activate the correct environment
echo.
echo 4. Manually add the site-packages path to PYTHONPATH:
echo    set PYTHONPATH=%PYTHONPATH%;[site-packages-path-shown-above]
echo.
echo 5. As a last resort, you can try placing dotenv.py directly in your project folder:
echo    curl -o dotenv.py https://raw.githubusercontent.com/theskumar/python-dotenv/master/src/dotenv/main.py
echo.

pause 