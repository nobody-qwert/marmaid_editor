#!/bin/bash

# Create prod directory if it doesn't exist
mkdir -p prod

# Define output file
OUTPUT_FILE="prod/marmaid-editor.html"

# Create the combined HTML file
{
  # Read the HTML file up to the CSS link
  sed -n '1,/<link rel="stylesheet" href="styles.css">/p' index.html | sed '$d'
  
  # Insert the CSS content
  echo "<style>"
  cat styles.css
  echo "</style>"
  
  # Read the HTML file from after the CSS link to before the JS script
  sed -n '/<link rel="stylesheet" href="styles.css">/,/<script src="script.js"><\/script>/p' index.html | 
    sed '1d' | sed '$d'
  
  # Insert the JS content
  echo "<script>"
  cat script.js
  echo "</script>"
  
  # Read the rest of the HTML file
  sed -n '/<script src="script.js"><\/script>/,$p' index.html | sed '1d'
} > "$OUTPUT_FILE"

echo "Successfully created $OUTPUT_FILE"
