import { describe, it, expect } from "vitest";
import { TEAM_NAME_TO_ID, TEAM_ID_TO_CODE } from "../constants";

describe("TEAM_NAME_TO_ID", () => {
  it("has all 10 KBO teams", () => {
    expect(Object.keys(TEAM_NAME_TO_ID)).toHaveLength(10);
  });

  it("maps KT to kt", () => {
    expect(TEAM_NAME_TO_ID["KT"]).toBe("kt");
  });

  it("maps LG to lg", () => {
    expect(TEAM_NAME_TO_ID["LG"]).toBe("lg");
  });

  it("maps 삼성 to samsung", () => {
    expect(TEAM_NAME_TO_ID["삼성"]).toBe("samsung");
  });

  it("maps SSG to ssg", () => {
    expect(TEAM_NAME_TO_ID["SSG"]).toBe("ssg");
  });

  it("maps KIA to kia", () => {
    expect(TEAM_NAME_TO_ID["KIA"]).toBe("kia");
  });

  it("maps 두산 to doosan", () => {
    expect(TEAM_NAME_TO_ID["두산"]).toBe("doosan");
  });

  it("maps 한화 to hanwha", () => {
    expect(TEAM_NAME_TO_ID["한화"]).toBe("hanwha");
  });

  it("maps NC to nc", () => {
    expect(TEAM_NAME_TO_ID["NC"]).toBe("nc");
  });

  it("maps 롯데 to lotte", () => {
    expect(TEAM_NAME_TO_ID["롯데"]).toBe("lotte");
  });

  it("maps 키움 to kiwoom", () => {
    expect(TEAM_NAME_TO_ID["키움"]).toBe("kiwoom");
  });
});

describe("TEAM_ID_TO_CODE", () => {
  it("has all 10 KBO teams", () => {
    expect(Object.keys(TEAM_ID_TO_CODE)).toHaveLength(10);
  });

  it("maps doosan to OB", () => {
    expect(TEAM_ID_TO_CODE["doosan"]).toBe("OB");
  });

  it("maps ssg to SK", () => {
    expect(TEAM_ID_TO_CODE["ssg"]).toBe("SK");
  });

  it("maps kia to HT", () => {
    expect(TEAM_ID_TO_CODE["kia"]).toBe("HT");
  });

  it("maps hanwha to HH", () => {
    expect(TEAM_ID_TO_CODE["hanwha"]).toBe("HH");
  });

  it("maps samsung to SS", () => {
    expect(TEAM_ID_TO_CODE["samsung"]).toBe("SS");
  });

  it("maps nc to NC", () => {
    expect(TEAM_ID_TO_CODE["nc"]).toBe("NC");
  });

  it("maps lotte to LT", () => {
    expect(TEAM_ID_TO_CODE["lotte"]).toBe("LT");
  });

  it("maps kiwoom to WO", () => {
    expect(TEAM_ID_TO_CODE["kiwoom"]).toBe("WO");
  });

  it("maps lg to LG", () => {
    expect(TEAM_ID_TO_CODE["lg"]).toBe("LG");
  });

  it("maps kt to KT", () => {
    expect(TEAM_ID_TO_CODE["kt"]).toBe("KT");
  });
});
