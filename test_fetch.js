async function test() {
  try {
    const res = await fetch("http://localhost:5000/api/v1/catalog/products?search=Galaxy");
    const json = await res.json();
    console.log("Galaxy search total:", json.data.pagination.total);
    console.log("Products:", json.data.products.map(p => p.name));
  } catch (err) {
    console.error(err);
  }
}
test();
