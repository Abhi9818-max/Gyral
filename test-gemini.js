const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGeneration() {
    const key = "AIzaSyDrV4M5kej2nJBfxGOySvzbM65HZK4jFYE";
    console.log("Testing Generation with gemini-2.0-flash...");

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent("Say 'I am alive'.");
        const response = await result.response;
        console.log("SUCCESS:", response.text());
    } catch (error) {
        console.error("FAILURE:", error.message);
        if (error.response) {
            console.error("Response:", JSON.stringify(error.response || {}, null, 2));
        }
    }
}

testGeneration();
