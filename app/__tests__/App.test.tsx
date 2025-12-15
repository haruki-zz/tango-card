import { render } from "@testing-library/react-native";

import HomeScreen from "../index";

describe("HomeScreen", () => {
  it("renders the landing copy", () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText("Tango Card")).toBeTruthy();
    expect(getByText("日语单词记忆的基础环境已就绪。")).toBeTruthy();
  });
});
