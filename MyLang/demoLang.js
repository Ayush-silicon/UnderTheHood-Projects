/**
 * Lexer: Converts input string into a list of tokens.
 */
function lexer(input) {
    const tokens = [];
    let cursor = 0;
    // New keywords: 'if'
    const KEYWORDS = ['ye', 'de', 'if']; 

    while (cursor < input.length) {
        let char = input[cursor];

        // 1. Skip whitespace
        if (/\s/.test(char)) {
            cursor++;
            continue;
        }

        // 2. Identifiers and Keywords
        if (/[a-zA-Z_]/.test(char)) {
            let word = '';
            while (/[a-zA-Z0-9_]/.test(input[cursor])) {
                word += input[cursor];
                cursor++;
            }
            if (KEYWORDS.includes(word)) {
                tokens.push({ type: 'KEYWORD', value: word });
            } else {
                tokens.push({ type: 'IDENTIFIER', value: word });
            }
            continue;
        }

        // 3. Numbers
        if (/[0-9]/.test(char)) {
            let number = '';
            while (/[0-9]/.test(input[cursor])) {
                number += input[cursor];
                cursor++;
            }
            tokens.push({ type: 'NUMBER', value: number });
            continue;
        }

        // 4. Operators (Updated to include 'is' as a comparison operator)
        // We'll treat 'is' as a special operator for comparison (e.g., x is 10)
        if ('=+-*/'.includes(char)) {
            tokens.push({ type: 'OPERATOR', value: char });
            cursor++;
            continue;
        }
        
        // Check for 'is' comparison operator
        if (input.substring(cursor, cursor + 2) === 'is') {
            tokens.push({ type: 'OPERATOR', value: 'is' });
            cursor += 2;
            continue;
        }

        // 5. Punctuation
        if ('();{}'.includes(char)) {
            tokens.push({ type: 'PUNCTUATION', value: char });
            cursor++;
            continue;
        }

        // Handle unrecognized characters
        throw new Error(`Unrecognized character: ${char}`);
    }
    return tokens;
}

 /**
 * Parser: Converts a list of tokens into an Abstract Syntax Tree (AST).
 */
function parse(tokens) {
    const ast = { type: 'Program', body: [] };

    // Function to parse a single statement
    function parseStatement() {
        const token = tokens.shift();

        // Variable Declaration: 'ye x = ...'
        if (token && token.type === 'KEYWORD' && token.value === 'ye') {
            return parseVariableDeclaration();
        } 
        // Conditional Statement: 'if ... { ... }'
        else if (token && token.type === 'KEYWORD' && token.value === 'if') {
            return parseIfStatement();
        } 
        // Debug Statement: 'de x' (for evaluation)
        else if (token && token.type === 'KEYWORD' && token.value === 'de') {
            return parseDebugStatement();
        } 
        else if (token) {
            throw new Error(`Unexpected token at start of statement: ${JSON.stringify(token)}`);
        }
        return null;
    }

    // Parses 'ye variable = value;'
    function parseVariableDeclaration() {
        const variable = tokens.shift(); // identifier
        const assignment = tokens.shift(); // =

        if (!variable || variable.type !== 'IDENTIFIER') throw new Error("Expected identifier after 'ye'");
        if (!assignment || assignment.type !== 'OPERATOR' || assignment.value !== '=') throw new Error("Expected '=' after variable identifier");

        // Parse expression: a number, an identifier, or a binary expression (e.g., x + y)
        const expression = parseExpression();

        return {
            type: 'VariableDeclaration',
            identifier: variable.value,
            value: expression
        };
    }

    // Parses a simple expression: Number, Identifier, or BinaryExpression
    function parseExpression() {
        let left = tokens.shift();
        
        if (left.type === 'NUMBER') {
            left = { type: 'Literal', value: parseInt(left.value) };
        } else if (left.type === 'IDENTIFIER') {
            left = { type: 'Identifier', name: left.value };
        } else {
            throw new Error(`Expected a value or identifier for expression, got ${left.type}`);
        }

        const nextToken = tokens[0];
        
        // Check for Binary Expression (e.g., x + y)
        if (nextToken && nextToken.type === 'OPERATOR' && '+-*/'.includes(nextToken.value)) {
            const operator = tokens.shift();
            const right = tokens.shift();
            
            let rightNode;
            if (right.type === 'NUMBER') {
                rightNode = { type: 'Literal', value: parseInt(right.value) };
            } else if (right.type === 'IDENTIFIER') {
                rightNode = { type: 'Identifier', name: right.value };
            } else {
                throw new Error(`Expected a value or identifier for right side of expression, got ${right.type}`);
            }

            return {
                type: 'BinaryExpression',
                operator: operator.value,
                left: left,
                right: rightNode
            };
        }
        
        // Single value (number or identifier)
        return left;
    }
    
    // Parses 'if condition { body }'
    function parseIfStatement() {
        const left = parseExpression(); // e.g., 'x'
        const operator = tokens.shift(); // e.g., 'is'
        
        if (!operator || operator.type !== 'OPERATOR' || operator.value !== 'is') {
            throw new Error("Expected comparison operator 'is' in if statement");
        }
        
        const right = parseExpression(); // e.g., '10'

        // Construct the condition part of the AST node
        const condition = {
            type: 'BinaryExpression',
            operator: operator.value, // 'is'
            left: left,
            right: right
        };

        const openBrace = tokens.shift();
        if (!openBrace || openBrace.value !== '{') throw new Error("Expected '{' after if condition");

        // Parse the body of the if statement
        const body = [];
        while (tokens.length > 0 && tokens[0].value !== '}') {
            const statement = parseStatement();
            if (statement) body.push(statement);
        }

        const closeBrace = tokens.shift();
        if (!closeBrace || closeBrace.value !== '}') throw new Error("Expected '}' after if body");

        return {
            type: 'IfStatement',
            condition: condition,
            consequent: body // The 'then' part of the if statement
        };
    }

    // Parses 'de variable;'
    function parseDebugStatement() {
        const variable = tokens.shift();
        if (!variable || variable.type !== 'IDENTIFIER') throw new Error("Expected identifier after 'de'");
        return {
            type: 'DebugStatement',
            identifier: variable.value
        };
    }

    // Main parsing loop
    while (tokens.length > 0) {
        const statement = parseStatement();
        if (statement) {
            ast.body.push(statement);
        }
    }
    return ast;
}



/**
 * Evaluator (Runner): Executes the AST by traversing it.
 */
function evaluate(ast) {
    // A simple symbol table (scope) to store variables
    const scope = new Map();

    // Helper to evaluate nodes recursively
    function walk(node) {
        switch (node.type) {
            case 'Program':
                return node.body.map(walk);

            case 'VariableDeclaration':
                const value = walk(node.value);
                scope.set(node.identifier, value);
                return value;
            
            case 'DebugStatement':
                const val = scope.get(node.identifier);
                console.log(`Debug (de ${node.identifier}):`, val !== undefined ? val : 'Undefined');
                return val;

            case 'IfStatement':
                const conditionResult = walk(node.condition);
                if (conditionResult) {
                    return node.consequent.map(walk);
                }
                return null;

            case 'BinaryExpression':
                // For comparison (e.g., 'is') or arithmetic (e.g., '+')
                const left = walk(node.left);
                const right = walk(node.right);

                switch (node.operator) {
                    case '+': return left + right;
                    case '-': return left - right;
                    case '*': return left * right;
                    case '/': return left / right;
                    case 'is': return left === right; // Comparison
                    default:
                        throw new Error(`Unknown operator: ${node.operator}`);
                }

            case 'Literal':
                return node.value;

            case 'Identifier':
                const identifierValue = scope.get(node.name);
                if (identifierValue === undefined) {
                    throw new Error(`Reference Error: Variable '${node.name}' is not defined.`);
                }
                return identifierValue;

            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    // Start evaluation from the root
    return walk(ast);
}



/**
 * Compiler: The main entry point.
 */
function compiler(input) {
    console.log("--- Tokens ---");
    const tokens = lexer(input);
    console.log(tokens);
    
    console.log("\n--- AST ---");
    const ast = parse(tokens);
    console.log(JSON.stringify(ast, null, 2));

    console.log("\n--- Evaluation (Runner) ---");
    const result = evaluate(ast);
    return result;
}

// Example code with a new 'if' statement
const code = `
ye x = 10;
ye y = 20;

if x is 10 {
    ye result = x + y;
    de result;
}

de x;
de y;
`;

compiler(code);