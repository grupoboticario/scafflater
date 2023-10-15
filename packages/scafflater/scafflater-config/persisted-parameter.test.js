import PersistedParameter from "./persisted-parameter";

test("reduceParameters", () => {
  // ARRANGE
  const parameters = [
    new PersistedParameter("par1", 1),
    new PersistedParameter("par2", "string"),
    new PersistedParameter("par3", true),
  ];

  // ACT
  const result = PersistedParameter.reduceParameters(parameters);

  // ASSERT
  expect(result).toStrictEqual({
    par1: 1,
    par2: "string",
    par3: true,
  });
});

test("updateParameters", () => {
  // ARRANGE
  const parameters = [
    new PersistedParameter("existing-param-1", "old-value-1"),
    new PersistedParameter("existing-param-2", "old-value-2"),
  ];
  const newParameter = new PersistedParameter("new-param-3", "new-value-3");
  const updateParameter = new PersistedParameter(
    "existing-param-1",
    "new-value-4",
  );

  // ACT
  PersistedParameter.updateParameters(parameters, newParameter);
  PersistedParameter.updateParameters(parameters, updateParameter);

  // ASSERT
  expect(parameters).toStrictEqual([
    new PersistedParameter("existing-param-1", "new-value-4"),
    new PersistedParameter("existing-param-2", "old-value-2"),
    new PersistedParameter("new-param-3", "new-value-3"),
  ]);
});
