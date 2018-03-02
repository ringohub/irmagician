const IRMagician = require('./lib/irMagician');

(async () => {
  const irm = await new IRMagician().catch(e => {console.error(e.message)});
  console.log(irm.port.path);
  irm.version();
  irm.close();
})();

