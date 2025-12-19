import { generate_time_sorted_random } from "../../src/utils/general.utils";

describe("generate_time_sorted_random", () => {
  it("should generate a valid time-sorted random number", () => {
    const randomNumber = generate_time_sorted_random();
    expect(typeof randomNumber).toBe("number");
    expect(randomNumber).toBeGreaterThan(0);
  });

  it("should generate increasing numbers over time", (done) => {
    const firstNumber = generate_time_sorted_random();
    setTimeout(() => {
      const secondNumber = generate_time_sorted_random();
      expect(secondNumber).toBeGreaterThan(firstNumber);
      done();
    }, 1); // Small delay to ensure timestamp increases
  });
});

