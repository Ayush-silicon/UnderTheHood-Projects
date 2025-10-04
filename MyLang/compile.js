function lexer(input){
    const tokens = [];
    let cursor = 0;
    while(cursor < input.length){
        let char = input[cursor];
        // skip whitespace
        if(/\s/.test(char)){
            cursor++;
            continue;
        }
        // identifiers and keywords
        if(/[a-zA-Z_]/.test(char)){
            let word = '';
            while(/[a-zA-Z0-9_]/.test(input[cursor])){
                word += input[cursor];
                cursor++;
            } 
            if(word ==='ye' || word === 'de'){
                tokens.push({type: 'KEYWORD', value: word});
            }
            else{
                tokens.push({type: 'IDENTIFIER', value: word});
            }
            continue;
        }
        // numbers
        if(/[0-9]/.test(char)){
            let number = '';
            while(/[0-9]/.test(input[cursor])){
                number += input[cursor];
                cursor++;
            }
            tokens.push({type: 'NUMBER', value: number});
            continue;
        }
        // operators
        if('=+-*/'.includes(char)){
            tokens.push({type: 'OPERATOR', value: char});
            cursor++;
            continue;
        }
        // punctuation
        if('();{}'.includes(char)){
            tokens.push({type: 'PUNCTUATION', value: char});
            cursor++;
            continue;
        }
    }
    return tokens;
}
function parse(tokens){
    const ast = {type: 'Program', body: []};
    while(tokens.length > 0){
        const token = tokens.shift();
        if(token.type === 'KEYWORD' && token.value === 'ye'){
            const variable = tokens.shift();
            if(variable.type === 'IDENTIFIER'){
                const assignment = tokens.shift();
                if(assignment.type === 'OPERATOR' && assignment.value === '='){
                    const value = tokens.shift();
                    if(value.type === 'NUMBER'){
                        ast.body.push({
                            type: 'VariableDeclaration',
                            identifier: variable.value,
                            value: value.value
                        });
                    }
                    // z = x + y
                    else if(value.type === 'IDENTIFIER'){
                        const operator = tokens.shift();        
                        if(operator.type === 'OPERATOR' && '+-*/'.includes(operator.value)){
                            const right = tokens.shift();
                            if(right.type === 'IDENTIFIER' || right.type === 'NUMBER'){
                                ast.body.push({
                                    type: 'VariableDeclaration',
                                    identifier: variable.value,     
                                    value: {
                                        type: 'BinaryExpression',
                                        operator: operator.value,
                                        left: value.value,
                                        right: right.value
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    return ast;
}
function compiler(input){
    const tokens = lexer(input);
    const ast = parse(tokens);
    console.log(ast);
}

const code = `
ye x = 10;
ye y = 20;
ye z = x + y;
de z;
`;
compiler(code);

