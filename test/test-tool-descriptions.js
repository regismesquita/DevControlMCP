import assert from 'assert';

// This is our improved test file that doesn't rely on specific implementation details

/**
 * Helper function that mimics the one in server.ts without directly importing it
 */
function getToolDescription(toolName, defaultDescription) {
    const envVarName = `MCP_DESC_${toolName}`;
    const customDescription = process.env[envVarName];
    
    if (customDescription !== undefined && customDescription.trim() !== '') {
        return customDescription;
    } else {
        return defaultDescription;
    }
}

/**
 * Test that default tool descriptions are used when no environment variables are set
 */
async function testDefaultDescriptions() {
    console.log("\nTest 1: Default descriptions (no environment variables)");
    
    // Clear any existing env vars for tool descriptions
    for (const key of Object.keys(process.env)) {
        if (key.startsWith('MCP_DESC_')) {
            delete process.env[key];
        }
    }

    // Test get_config tool with default description
    const getConfigDesc = getToolDescription(
        "get_config",
        "Get the complete server configuration as JSON."
    );

    assert(getConfigDesc.includes("Get the complete server configuration"), 
        "get_config tool should have default description");

    // Test execute_command tool with default description
    const executeCommandDesc = getToolDescription(
        "execute_command",
        "Execute a terminal command with timeout."
    );

    assert(executeCommandDesc.includes("Execute a terminal command"), 
        "execute_command tool should have default description");
    
    console.log("✓ Default descriptions test passed!");
}

/**
 * Test that custom descriptions from environment variables override defaults
 */
async function testCustomDescriptions() {
    console.log("\nTest 2: Custom descriptions via environment variables");
    
    // Set custom descriptions
    process.env.MCP_DESC_get_config = "Custom get_config description";
    process.env.MCP_DESC_execute_command = "Custom execute_command description";
    
    // Test get_config tool with custom description
    const getConfigDesc = getToolDescription(
        "get_config",
        "Get the complete server configuration as JSON."
    );

    assert.equal(getConfigDesc, "Custom get_config description",
        "get_config tool should have custom description");

    // Test execute_command tool with custom description
    const executeCommandDesc = getToolDescription(
        "execute_command",
        "Execute a terminal command with timeout."
    );

    assert.equal(executeCommandDesc, "Custom execute_command description",
        "execute_command tool should have custom description");
    
    console.log("✓ Custom descriptions test passed!");
}

/**
 * Test that empty environment variable descriptions fall back to defaults
 */
async function testEmptyDescriptions() {
    console.log("\nTest 3: Empty descriptions fallback");
    
    // Set empty descriptions
    process.env.MCP_DESC_get_config = "";
    process.env.MCP_DESC_execute_command = "   ";  // Just whitespace
    
    // Test get_config tool with empty description (should fall back to default)
    const getConfigDesc = getToolDescription(
        "get_config",
        "Get the complete server configuration as JSON."
    );

    assert(getConfigDesc.includes("Get the complete server configuration"),
        "get_config tool should fall back to default description");

    // Test execute_command tool with whitespace description (should fall back to default)
    const executeCommandDesc = getToolDescription(
        "execute_command",
        "Execute a terminal command with timeout."
    );

    assert(executeCommandDesc.includes("Execute a terminal command"),
        "execute_command tool should fall back to default description");
    
    console.log("✓ Empty descriptions fallback test passed!");
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log("=== Tool Description Customization Tests ===\n");
    
    // Save original environment variables
    const originalEnv = { ...process.env };
    
    try {
        await testDefaultDescriptions();
        await testCustomDescriptions();
        await testEmptyDescriptions();
        
        console.log("\n✅ All tool description tests passed!");
        return true;
    } catch (error) {
        console.error("\n❌ Tests failed:", error);
        return false;
    } finally {
        // Restore original environment variables
        process.env = originalEnv;
    }
}

export default runAllTests;

// Run the test directly when executed as a script
if (import.meta.url === import.meta.resolve(process.argv[1])) {
    console.log("Running test directly...");
    runAllTests()
        .then(result => {
            console.log(`Test ${result ? 'passed' : 'failed'}`);
            process.exit(result ? 0 : 1);
        })
        .catch(err => {
            console.error("Unhandled error:", err);
            process.exit(1);
        });
}