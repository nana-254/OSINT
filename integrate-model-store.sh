#!/bin/bash

# Enhanced Model Store Integration Script
# This script integrates the enhanced model store into your OSINT app

echo "🚀 Enhanced Model Store Integration"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "static/index.html" ]; then
    echo "❌ Error: Please run this script from the OSINT project root directory"
    exit 1
fi

echo "✓ Found project directory"
echo ""

# Backup existing files
echo "📦 Creating backups..."
cp static/index.html static/index.html.backup
cp static/styles.css static/styles.css.backup
cp static/app.js static/app.js.backup
echo "✓ Backups created (.backup files)"
echo ""

# Add enhanced CSS link to index.html
echo "🎨 Adding enhanced CSS..."
if ! grep -q "styles-models-enhanced.css" static/index.html; then
    sed -i '/<link rel="stylesheet" href="styles.css">/a\    <link rel="stylesheet" href="styles-models-enhanced.css">' static/index.html
    echo "✓ Enhanced CSS link added"
else
    echo "✓ Enhanced CSS already linked"
fi
echo ""

# The enhanced JS is already appended to app.js, so we just need to verify
echo "🔧 Verifying JavaScript integration..."
if grep -q "ENHANCED MODEL STORE INTEGRATION" static/app.js; then
    echo "✓ Enhanced JavaScript already integrated"
else
    echo "⚠ Enhanced JavaScript not found - it should have been appended to app.js"
fi
echo ""

# Check if model store HTML needs to be replaced
echo "📝 Checking HTML structure..."
if grep -q "AI MODEL MARKETPLACE" static/index.html; then
    echo "✓ Enhanced HTML already integrated"
else
    echo "⚠ HTML needs manual integration - see MODEL_STORE_HTML.html"
    echo "  Replace the <section id=\"view-models\"> section in index.html"
fi
echo ""

# Verify all required files exist
echo "📋 Verifying files..."
files=(
    "static/app-models-enhanced.js"
    "static/styles-models-enhanced.css"
    "MODEL_STORE_HTML.html"
    "INTEGRATION_GUIDE.md"
)

all_present=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "❌ Missing: $file"
        all_present=false
    fi
done
echo ""

if [ "$all_present" = true ]; then
    echo "✅ All files present!"
else
    echo "⚠ Some files are missing - please check"
fi
echo ""

# Final instructions
echo "📖 Next Steps:"
echo "=============="
echo ""
echo "1. Replace the model store HTML section:"
echo "   - Open static/index.html"
echo "   - Find <section id=\"view-models\">"
echo "   - Replace it with content from MODEL_STORE_HTML.html"
echo ""
echo "2. Test the integration:"
echo "   - Open the app in your browser"
echo "   - Navigate to OLLAMA MODELS tab"
echo "   - Try searching for 'best coding model'"
echo "   - Check system specs display"
echo "   - Test model downloads"
echo ""
echo "3. Read the full guide:"
echo "   - See INTEGRATION_GUIDE.md for details"
echo "   - Check troubleshooting section if needed"
echo ""
echo "🎉 Integration script complete!"
echo ""
echo "To restore backups if needed:"
echo "  mv static/index.html.backup static/index.html"
echo "  mv static/styles.css.backup static/styles.css"
echo "  mv static/app.js.backup static/app.js"
