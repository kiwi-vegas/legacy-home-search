# Skill: HSS Widget Code Generator

## Overview
Generate Home Search Site (HSS) Widget JavaScript code for embedding real estate listing widgets on any website. These React-based widgets display property listings filtered by location parameters.

## Role & Expertise
Act as a front-end developer specializing in HSS widget integration:
- Expert in JavaScript widget embedding and configuration
- Proficient in JSON parameter formatting for widget customization
- Knowledgeable about real estate search location parameters (city, state, ZIP, neighborhood)

## Core Capabilities
1. **Listing Widget Generation**: Create fully functional listing widgets using location-based search parameters
2. **Multi-location Support**: Handle single or multiple location inputs (city, state, ZIP code, neighborhood)
3. **Special Flag Support**: Implement special search flags like "featured" listings
4. **Complete Code Integration**: Provide header, body, and footer code blocks for seamless widget deployment

## Guidelines & Best Practices
### Do's
- Use JSON for search parameter data 
- Use single quotes for JSON data within HTML attributes (e.g., `data-search='{"key":"value"}'`)
- Always include all three code blocks: header, body, and footer
- Validate location inputs for proper formatting (capitalization, abbreviations)
- Include the correct search domain in the header configuration
- Use proper indentation and formatting for code readability

### Don'ts
- Do not use double quotes around JSON parameter data in HTML attributes
- Do not omit the header or footer script tags
- Do not forget to specify the search domain in `window.YLOPO_WIDGETS`
- Do not use invalid location parameters or typos in city/state names
- Do not mix quote styles within the same attribute

## Process & Workflow
1. **Gather Location Requirements**: Ask the user for location details:
   - City name
   - State (2-letter abbreviation for US)
   - ZIP/postal code (if applicable)
   - Neighborhood name (if applicable)
   - Special flags (e.g., "featured")

2. **Construct JSON Parameters**: Build the `data-search` JSON object with appropriate location array:
   ```json
   {"locations":[{"city":"CityName", "state":"ST"}]}
   ```

3. **Generate Header Code**: Create the domain configuration:
   ```html
   <script>window.YLOPO_WIDGETS = {"domain": "search.example.com"}</script>
   ```

4. **Generate Body Code**: Create the widget div with data attributes:
   ```html
   <div class="YLOPO_resultsWidget" data-search='...'></div>
   ```

5. **Generate Footer Code**: Add the widget loader script:
   ```html
   <script src="https://search.example.com/build/js/widgets-1.0.0.js" defer></script>
   ```

6. **Verify & Present**: Ensure all three blocks are present and properly formatted

## Context & Background

### Results Widget Location Parameter Format
- **city**: Full city name with proper capitalization (e.g., "Virginia Beach")
- **state**: Two-letter state abbreviation in uppercase (e.g., "VA")
- **zipcode**: Numeric ZIP code or postal code depending on country
- **neighborhood**: Specific neighborhood name within a city
- **featured**: Special flag for featured listings

### Results Widget JSON Structure
The `data-search` attribute accepts a JSON object with a `locations` array:
```json
{
  "locations": [
    {"city": "CityName", "state": "ST"},
    {"city": "AnotherCity", "state": "ST"}
  ]
}
```

### Market Trends Widget Parameter Format
 - **simpleSearchCity**: Full city name with proper capitalizaztion (e.g., "Virginia Beach")
 - **simpleSearchState**: Two-letter state abbreviation in uppercase (e.g., "VA")
 - **simpleSearchZipCode**: Numeric ZIP code or postal code depending on country
 - **simpleSearchNeighborhood**: Specific neighborhood name within a city
 - **simpleSearchSubdivision**: Specific subdivision name within a city
 - **simpleSearchCounty**: Specific County name
 - **simpleSearchMetro**: Specific Metropolitain area

### Market Trends Widget JSON Structure
The `data-search` attribute accepts a JSON object:
```json
{
	"simpleSearchCity": "Virginia Beach",
	"simpleSearchState": "VA"
}
```

### Domain Configuration
The search domain must match the HSS installation being used (e.g., "search.buyingva.com").

## Output Format

### Structure
Always provide code in three distinct, labeled sections:

**1. Header Code** (Domain Configuration)
```html
<script>window.YLOPO_WIDGETS = {"domain": "search.example.com"}</script>
```

**2. Body Code** (Widget Container)
```html
<div class="YLOPO_resultsWidget" data-search='{"locations":[...]}'></div>
```

**3. Footer Code** (Widget Loader)
```html
<script src="https://search.example.com/build/js/widgets-1.0.0.js" defer></script>
```

### Formatting Rules
- Use HTML code blocks for all output
- Label each section clearly
- Ensure proper indentation
- Use single quotes around JSON in HTML attributes
- Keep each code block on separate lines for clarity

## Examples

### Example 1: Single Location Widget
**Input**: Create a listing widget for Virginia Beach, VA

**Output**: 

**Header Code:**
```html
<script>window.YLOPO_WIDGETS = {"domain": "search.buyingva.com"}</script>
```

**Body Code:**
```html
<div class="YLOPO_resultsWidget" data-search='{"locations":[{"city":"Virginia Beach", "state":"VA"}]}'></div>
```

**Footer Code:**
```html
<script src="https://search.buyingva.com/build/js/widgets-1.0.0.js" defer></script>
```

---

### Example 2: Multiple Locations Widget
**Input**: Create a widget for Norfolk and Chesapeake, VA

**Output**:

**Header Code:**
```html
<script>window.YLOPO_WIDGETS = {"domain": "search.buyingva.com"}</script>
```

**Body Code:**
```html
<div class="YLOPO_resultsWidget" data-search='{"locations":[{"city":"Norfolk", "state":"VA"},{"city":"Chesapeake", "state":"VA"}]}'></div>
```

**Footer Code:**
```html
<script src="https://search.buyingva.com/build/js/widgets-1.0.0.js" defer></script>
```

---

### Example 3: ZIP Code Search
**Input**: Create a widget for ZIP code 23451

**Output**:

**Header Code:**
```html
<script>window.YLOPO_WIDGETS = {"domain": "search.buyingva.com"}</script>
```

**Body Code:**
```html
<div class="YLOPO_resultsWidget" data-search='{"locations":[{"zipcode":"23451"}]}'></div>
```

**Footer Code:**
```html
<script src="https://search.buyingva.com/build/js/widgets-1.0.0.js" defer></script>
```

---

### Example 4: Featured Listings
**Input**: Create a widget for featured listings in Virginia Beach

**Output**:

**Header Code:**
```html
<script>window.YLOPO_WIDGETS = {"domain": "search.buyingva.com"}</script>
```

**Body Code:**
```html
<div class="YLOPO_resultsWidget" data-search='{"locations":[{"city":"Virginia Beach", "state":"VA"}], "featured": true}'></div>
```

**Footer Code:**
```html
<script src="https://search.buyingva.com/build/js/widgets-1.0.0.js" defer></script>
```

---

### Example 5: Search Widget
**Input**: Create a search widget

**Output**:

**Header Code:**
```html
<script>window.YLOPO_WIDGETS = {"domain": "search.buyingva.com"}</script>
```

**Body Code:**
```html
<div class="YLOPO_searchWidget"></div>
```

**Footer Code:**
```html
<script src="https://search.buyingva.com/build/js/widgets-1.0.0.js" defer></script>
```

---

### Example 6: Market Trends Widget
**Input**: Create a market trends widget

**Output**:

**Header Code:**
```html
<script>window.YLOPO_WIDGETS = {"domain": "search.buyingva.com"}</script>
```

**Body Code:**
```html
<div class="YLOPO_marketTrendsWidget" data-searchlocation='{"simpleSearchCity":"Virginia Beach","simpleSearchState": "VA"}'></div>
```

**Footer Code:**
```html
<script src="https://search.buyingva.com/build/js/widgets-1.0.0.js" defer></script>
```

## Multiple Widgets On a Page
The Header Code and Footer Code should be insterted exactly once into a page with no exceptions, but the Body Code could be inserted multiple times, with various combinations of Body Code to embed multiple widgets on a page.

## Quality Criteria
A well-generated widget code should:
- Include all three required code sections (header, body, footer)
- Use consistent domain across header and footer
- Format JSON parameters with single quotes in HTML attributes
- Use proper location parameter spelling and capitalization
- Be ready to copy-paste directly into a webpage
- Load successfully and display active listing data
- Be properly indented and readable

## Edge Cases & Limitations

### Domain Specification
- **Issue**: User doesn't specify the search domain
- **Solution**: Ask for the search domain or use a placeholder like "search.example.com" with a note to replace it

### International Locations
- **Issue**: Non-US locations may use different address formats
- **Solution**: Use "postalcode" instead of "zipcode" for international addresses; confirm country-specific requirements

### Invalid Location Names
- **Issue**: Misspelled cities or incorrect state abbreviations
- **Solution**: Validate common locations or ask for confirmation on unusual spellings

### Multiple Widget Types
- **Issue**: User might need different widget types beyond listing widgets
- **Solution**: This skill currently supports listing widgets only; ask for clarification if other widget types are mentioned

### Missing Parameters
- **Issue**: User provides incomplete location information
- **Solution**: Request the minimum required information (typically city and state, or ZIP code)

### Special Characters in Location Names
- **Issue**: Cities with apostrophes or special characters (e.g., "O'Fallon")
- **Solution**: Preserve special characters as-is in JSON; they're handled by the widget parser

## Related Skills
- **HTML/CSS Integration**: For styling and positioning widgets on websites
- **Real Estate Data APIs**: For understanding property search parameters
- **React Component Development**: For advanced widget customization (if needed)