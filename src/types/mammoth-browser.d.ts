declare module 'mammoth/mammoth.browser' {
  type RawTextResult = {
    value: string;
  };

  const mammoth: {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<RawTextResult>;
  };

  export default mammoth;
}
