import { describe, expect, it } from "vitest";
import { dfAreas, dfPropertyType } from "./feed-dfimoveis";

describe("dfPropertyType (v1.6)", () => {
  it("casa térrea vira Casa / Padrão", () => {
    expect(dfPropertyType("casa", "padrao")).toEqual({ tipo: "Casa", subtipo: "Padrão" });
  });
  it("casa de condomínio vira Casa Condomínio / Padrão", () => {
    expect(dfPropertyType("casa_condominio", "padrao")).toEqual({ tipo: "Casa Condomínio", subtipo: "Padrão" });
  });
  it("sobrado em condomínio vira Casa Condomínio / Sobrado", () => {
    expect(dfPropertyType("casa_condominio", "sobrado")).toEqual({ tipo: "Casa Condomínio", subtipo: "Sobrado" });
  });
  it("terreno vira Lote / Residencial", () => {
    expect(dfPropertyType("terreno", null)).toEqual({ tipo: "Lote", subtipo: "Residencial" });
  });
  it("comercial vira Sala / Padrão", () => {
    expect(dfPropertyType("comercial", null)).toEqual({ tipo: "Sala", subtipo: "Padrão" });
  });
  it("apartamento duplex vira Apartamento / Duplex", () => {
    expect(dfPropertyType("apartamento", "duplex")).toEqual({ tipo: "Apartamento", subtipo: "Duplex" });
  });
  it("tipo desconhecido não é inventado", () => {
    expect(dfPropertyType("galpao_xyz", null)).toBeNull();
  });
});

describe("dfAreas (v1.6)", () => {
  it("AreaUtil cai em area quando útil e construída estão vazias", () => {
    expect(dfAreas({ type: "rural", area: 20000, useful_area: null, built_area: null }).util).toBe(20000);
  });
  it("casa envia AreaDoTerreno", () => {
    expect(dfAreas({ type: "casa", area: 510, useful_area: 155, built_area: null }).terreno).toBe(510);
  });
  it("apartamento não envia AreaDoTerreno", () => {
    expect(dfAreas({ type: "apartamento", area: 120, useful_area: 100, built_area: null }).terreno).toBeNull();
  });
  it("AreaTotal usa AreaUtil quando area vazia, nunca 0", () => {
    expect(dfAreas({ type: "casa_condominio", area: 0, useful_area: 216, built_area: null })).toEqual({ util: 216, total: 216, terreno: null });
  });
});
