import CartParser from './CartParser';

let parser;
const path = '/home/bogus/Downloads/cart-parser/samples/cart.csv';
const testPath = '/home/bogus/Downloads/cart-parser/samples/test.csv'
beforeEach(() => {
    parser = new CartParser();
});

describe("CartParser - unit tests", () => {     
    describe("validate", () => {
        it("should return empty array: using valid data", () => {
            const items = [
                'Product name,Price,Quantity',
                'test1,1,1.000',
                'test2,2.0000,2'
            ];

            const result = parser.validate(items.join('\n'));
    
            expect(result).toEqual([]);
        }) 
        it("should return Header error: not valid first header name - Product name", () => {            
            const headerRow = 'test,Price,Quantity';
            const columnName = parser.schema.columns[0].name;
            const expected = parser.createError(
                parser.ErrorType.HEADER, 
                0, 
                0, 
                `Expected header to be named "${columnName}" but received ${headerRow.split(',')[0]}.`
            );

            const result = parser.validate(headerRow);

            expect(result[0]).toEqual(expected);
        }) 
        it("should return Row error: not valid count of cells in second row - 2 cells", () => {   
            const row = 'test,1';
            const rowLength = row.split(',').length;
            const validLength = parser.schema.columns.length;
            const expected = parser.createError(
                parser.ErrorType.ROW, 
                1, 
                -1, 
                `Expected row to have ${validLength} cells but received ${rowLength}.`
            );

            const result = parser.validate(`Product name,Price,Quantity\n${row}`);

            expect(result[0]).toEqual(expected);
        })
        it("should return Cell error: not valid type of first cell in second row - not a string ", () => {
            const row = `,1,1`;
            const expected = parser.createError(
                parser.ErrorType.CELL, 
                1, 
                0, 
                `Expected cell to be a nonempty string but received "${row.split(',')[0]}".`
            );

            const result = parser.validate(`Product name,Price,Quantity\n${row}`);

            expect(result[0]).toEqual(expected);
        })
        it("should return Cell error: not valid type of second cell in second row", () => {
            const rows = [`test,-1,1`, `test,'1',1`, `test,${NaN},1`];
            const errors = [
                `Expected cell to be a positive number but received "${rows[0].split(',')[1]}".`,
                `Expected cell to be a positive number but received "${rows[1].split(',')[1]}".`,
                `Expected cell to be a positive number but received "${rows[2].split(',')[1]}".`
            ];
            const expected = [
                parser.createError(parser.ErrorType.CELL, 1, 1, errors[0]),
                parser.createError(parser.ErrorType.CELL, 1, 1, errors[1]),
                parser.createError(parser.ErrorType.CELL, 1, 1, errors[2])
            ]

            const result = [
                parser.validate(`Product name,Price,Quantity\n${rows[0]}`),
                parser.validate(`Product name,Price,Quantity\n${rows[1]}`),
                parser.validate(`Product name,Price,Quantity\n${rows[2]}`)
            ];

            expect(result[0]).toContainEqual(expect.objectContaining(expected[0]));
            expect(result[1]).toContainEqual(expect.objectContaining(expected[1]));
            expect(result[2]).toContainEqual(expect.objectContaining(expected[2]));
        })
        it("should return array with 2 errors: header and row errors", () => {
            const headerRow = 'test,Price,Quantity';
            const row = 'test,1';
            const columnName = parser.schema.columns[0].name;
            const rowLength = row.split(',').length;
            const validLength = parser.schema.columns.length;
            const expected = [
                parser.createError(parser.ErrorType.HEADER, 0, 0, `Expected header to be named "${columnName}" but received ${headerRow.split(',')[0]}.`),
                parser.createError(parser.ErrorType.ROW, 1, -1, `Expected row to have ${validLength} cells but received ${rowLength}.`)
            ];

            const result = parser.validate(`${headerRow}\n${row}`);

            expect(result).toEqual(expected);
        })
        it("should return array with 3 errors: header, row and cell errors", () => {
            const headerRow = 'test,Price,Quantity';
            const row1 = 'test,1';
            const row2 = ',1,1';
            const columnName = parser.schema.columns[0].name;
            const rowLength = row1.split(',').length;
            const validLength = parser.schema.columns.length;
            const expected = [
                parser.createError(parser.ErrorType.HEADER, 0, 0, `Expected header to be named "${columnName}" but received ${headerRow.split(',')[0]}.`),
                parser.createError(parser.ErrorType.ROW, 1, -1, `Expected row to have ${validLength} cells but received ${rowLength}.`),
                parser.createError(parser.ErrorType.CELL, 2, 0, `Expected cell to be a nonempty string but received "${row2.split(',')[0]}".`)
            ];

            const result = parser.validate(`${headerRow}\n${row1}\n${row2}`);

            expect(result).toEqual(expected);
        })
    }) 
    describe("parseLine", () => {
        it("should return valid price: 1 instead 1.000(0)", () => {
            const row = 'test,1.00000000,1';
            const expected = 1;

            const result = parser.parseLine(row);

            expect(result.price).toEqual(expected);
        }) 
        it("should return valid item: test->test, 1.00(0)->1, 1->1", () => {
            const row = 'test,1.00000000,1';
            const expected = {
                'name': 'test',
                'price': 1,
                'quantity': 1
            };

            const result = parser.parseLine(row);
            delete result.id;

            expect(result).toEqual(expected); 
        }) 
    })
    describe("calcTotal", () => {
        it("should return total 111 of two products: 20*5 + 5.5*2", () => {
            const row1 = parser.parseLine('test,20,5.000');
            const row2 = parser.parseLine('test,5.5000,2');
            const expected = 111;
            const items = [row1, row2];

            const result = parser.calcTotal(items);

            expect(result).toEqual(expected);
        })
    })
});

describe("CartParser - integration tests", () => {
    it("should throw Error, because of wrong header: 'test' in 1 row", () => {
        expect(() => parser.parse(testPath)).toThrow();
    })
});