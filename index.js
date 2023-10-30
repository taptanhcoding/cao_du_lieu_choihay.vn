const puppeteer = require("puppeteer");
const fs = require("node:fs");

(async () => {
  let browser = await puppeteer.launch({
    headless: false,
  });

  async function getData(link, view, callback) {
    let page = await browser.newPage();
    await page.goto(link);
    if (view) await page.setViewport();
    let data = await page.evaluate(callback);
    await page.close();
    return data;
  }

  let categories = fs.existsSync('category.json') ? fs.readFileSync("category.json", "utf8") : false
  let listProduct = fs.existsSync('listProduct.json') ? fs.readFileSync("listProduct.json", "utf8"): false
  console.log({
    categories,listProduct
  });

  // return ;

  //cào danh sách danh mục
  if (!categories) {
    categories = await getData(main_page, { width: 1380, height: 1024 }, () => {
      let list_cate = document.querySelectorAll(".menu_item_a");
      list_cate = [...list_cate];
      const detailCate = list_cate.map((category) => {
        return {
          label: category.getAttribute("title"),
          link: category.getAttribute("href"),
          icon: category.querySelector("img").getAttribute("src"),
        };
      });
      return detailCate;
    });

    fs.writeFileSync("category.json", JSON.stringify(categories));
  }

  // console.log(categories);

  categories = fs.readFileSync("category.json", "utf8")

  categories = JSON.parse(categories)
  // cào danh sách sản phẩm từng danh mục
  if (!listProduct) {
    listProduct = {}
    for(let j = 0 ; j < categories.length; j++) {
      // listP
      let category = categories[j];
      let listUrl = await getData(category.link, false, () => {
        let list_product = document.querySelectorAll(
          "figure.product_image"
        );
        list_product = [...list_product];
        //   console.log("list product", list_product);
        return list_product.map((pr) =>
          pr.querySelector("a").getAttribute("href")
        );
      });
      listProduct[category.label] = listUrl;
    }

    fs.writeFileSync("listProduct.json", JSON.stringify(listProduct));
  }
  listProduct = fs.readFileSync("listProduct.json", "utf8");

  listProduct = JSON.parse(listProduct)
  // cào dữ liệu sản phẩm
  
  for (let category in listProduct) {
    let list_url = listProduct[category];
    let title_of_product= [];
    for (let i = 0; i < list_url.length; i++) {
      let detailProduct = await getData(list_url[i], false, () => {
        let nameProduct = document.querySelector("div.product_name h1") ? document.querySelector("div.product_name h1")?.innerHTML : "unknowname"
        let status = document.querySelector('div.status_quantity')
        let status_text = status.querySelector('span')?.innerText
        let status_icon = status.querySelector('.in-stock')?.innerHTML
        let priceCurrent = document.querySelector("#price")? document.querySelector("#price")?.getAttribute('content') : null
        let priceOld = document.querySelector("#price_old")? document.querySelector("#price_old")?.getAttribute('content') : null
        let currentImage = document.querySelector("#Zoomer > img")? document.querySelector("#Zoomer > img")?.getAttribute('src') : null
        let description = document.querySelector("div.bot_des p")? document.querySelector("div.bot_des p")?.innerHTML : "Chưa có mô tả"
        let detailDes = document.querySelector("#box_conten_linfo")? document.querySelector("#box_conten_linfo")?.innerHTML : "Đang cập nhật thông số.."
        let optionColor = document.querySelectorAll('div._color a.Selector')
        optionColor = [...optionColor]
        let optionColorDetail =[]
        if (optionColor.length >0) {
          optionColorDetail = optionColor.map(opColor=>{
                let codeColor = document.querySelector('span.color_item') ? opColor.querySelector('span.color_item').style.backgroundColor : null
                opColor.click()
                let imageColor = document.querySelector("#Zoomer > img")? document.querySelector("#Zoomer > img")?.getAttribute('src') : null
                let moneyPlus = document.querySelector('span.color_item') ? opColor.querySelector('span.color_item').getAttribute('data-original-title') : null
            return {
              codeColor,
              imageColor,
              moneyPlus
            }

          })
        }
        return {
            nameProduct,
            status: {
              status_icon,
              status_text
            },
            currentImage,
            optionColorDetail,
            priceCurrent,
            priceOld,
            description,
            detailDes 
        }
      });
      title_of_product.push(detailProduct);
    }
    fs.writeFileSync(`products/${category}.json`,JSON.stringify(title_of_product))
  }
  // console.log(title_of_product);

  await browser.close();
})();
