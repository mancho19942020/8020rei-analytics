#!/bin/bash

# Design System Documentation Updater
# Automatically scans components and reports what needs documentation

set -e

PROJECT_ROOT="/Users/work/Documents/Vibecoding/8020_metrics_hub/8020rei-analytics"
COMPONENTS_DIR="$PROJECT_ROOT/src/components/axis"
DOCS_FILE="$PROJECT_ROOT/docs/DESIGN_SYSTEM.md"

echo "🔍 Scanning Axis components..."
echo ""

# Get list of all Axis components
COMPONENTS=$(find "$COMPONENTS_DIR" -name "Axis*.tsx" -type f | sort)
COMPONENT_COUNT=$(echo "$COMPONENTS" | wc -l | tr -d ' ')

echo "📦 Found $COMPONENT_COUNT components in src/components/axis/"
echo ""

# Extract documented components from DESIGN_SYSTEM.md
echo "📖 Reading current documentation..."
DOCUMENTED=$(grep "^### Axis" "$DOCS_FILE" | sed 's/### //' || true)

echo "Documented components:"
echo "$DOCUMENTED" | sed 's/^/  - /'
echo ""

# Compare components vs documentation
echo "🔍 Analyzing gaps..."
echo ""

MISSING_DOCS=""
for component_file in $COMPONENTS; do
    component_name=$(basename "$component_file" .tsx)

    if ! echo "$DOCUMENTED" | grep -q "$component_name"; then
        MISSING_DOCS="$MISSING_DOCS\n  - $component_name (from $component_file)"
    fi
done

if [ -n "$MISSING_DOCS" ]; then
    echo "❌ Missing documentation for:"
    echo -e "$MISSING_DOCS"
    echo ""
    echo "💡 These components need to be added to docs/DESIGN_SYSTEM.md"
    exit 1
else
    echo "✅ All components are documented!"
    echo ""
    echo "Component list:"
    echo "$COMPONENTS" | sed 's/^/  - /'
fi

echo ""
echo "✨ Documentation scan complete!"
