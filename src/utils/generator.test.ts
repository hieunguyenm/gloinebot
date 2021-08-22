import * as generator from "./generator"
// @ponicode
describe("generator.generateButtonSets", () => {
    test("0", () => {
        let callFunction: any = () => {
            generator.generateButtonSets([1.0], 100, -100, "01-13-2020")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction: any = () => {
            generator.generateButtonSets([-1.0], 0, -100, "01-01-2020")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction: any = () => {
            generator.generateButtonSets([-0.5, -29.45, 10.0, 1.0], 1, 100, "32-01-2020")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction: any = () => {
            generator.generateButtonSets([-29.45], 100, 0, "32-01-2020")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction: any = () => {
            generator.generateButtonSets([10.0, 10.23, 10.0, -0.5, -0.5], 0, -100, "32-01-2020")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction: any = () => {
            generator.generateButtonSets([], NaN, NaN, "")
        }
    
        expect(callFunction).not.toThrow()
    })
})
