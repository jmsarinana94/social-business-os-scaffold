// Fail fast on unhandled rejections in e2e
process.on('unhandledRejection', (err) => {
   
  console.error('UnhandledRejection in e2e:', err);
  process.exit(1);
});