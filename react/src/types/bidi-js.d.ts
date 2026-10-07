declare module "bidi-js" {
  const bidi: {
    fromString: (input: string) => {
      toString: () => string;
    };
  };
  export default bidi;
}
