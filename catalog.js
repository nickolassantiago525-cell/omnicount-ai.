// Editable starter catalog transcribed from photographed inventory forms.
// Verify pack sizes against the current store inventory form before use.
const ROWS=`Chicken - Diced|Cooler|Bag:1
Sauce - Cheese Frz|Cooler|Pouch:1
Gold Chili Bean|Cooler|Pouch:1
Gold Chili Base|Cooler|Pouch:1
Gold Chili Meat 5.25 Lb|Cooler|Bag:1
Sauce - Beer Cheese|Cooler|Pouch:1
Cinnabon Icing|Cooler|Pouch:1
Sausage - Square|Cooler|Lbs:1
Eggs - Whole Shell|Cooler|Case:180,Flat:30,Each:1
Beef Sm Patty|Cooler|Case:33.24,Sleeve:8.31,Lbs:1
Beef 4 oz Patty|Cooler|Case:40,Sleeve:10,Lbs:1
Bacon - Roasted|Cooler|Case:150,Pack:15,Sheet:1
Dressing - Classic Ranch|Cooler|Case:192,Each:1
Dressing - Caesar Lemon Garlic|Cooler|Case:192,Each:1
Dressing - Pomegranate Vinaigrette|Cooler|Case:192,Each:1
Dressing - Creamy Salsa|Cooler|Case:120,Each:1
Milk - White|Cooler|Case:24,Each:1
Milk - Chocolate|Cooler|Case:24,Each:1
Orange Juice Btl|Cooler|Case:24,Each:1
Coffee - Cold Brew|Cooler|Case:12,Bottle:1
Lettuce - Shredded|Cooler|Case:4,Bag:1
Lettuce - Romaine Pre-Prepped|Cooler|Case:9,Bag:1
Tomatoes|Cooler|Case:15,Lbs:1
Onion|Cooler|Case:20,Flat:5,Lbs:1
Pickle - Crinkle Cut|Cooler|Bag:360,Each:1
Cheese - Blue Crumbles|Cooler|Case:6,Bag:1
Cheese - Regal Blend|Cooler|Case:9,Bag:1
Cheese - Shredded Cheddar|Cooler|Case:20,Bag:5,Lbs:1
Cheese - Asiago Slice|Cooler|Case:432,Pack:36,Slice:1
Cheese - Muenster|Cooler|Case:192,Pack:32,Slice:1
Cheese - 200 Slice|Cooler|Case:40,Block:5,Lbs:1
Frosty Mix - Chocolate|Cooler|Case:5,Bag:2.5,Gallon:1
Frosty Mix - Vanilla|Cooler|Case:5,Bag:2.5,Gallon:1
Dipping Sauce - Ranch|Dry Storage|Case:200,Each:1
Dipping Sauce - Honey BBQ|Dry Storage|Case:200,Each:1
Dipping Sauce - Honey Mustard|Dry Storage|Case:200,Each:1
Dipping Sauce - Sweet Chili|Dry Storage|Case:200,Each:1
Dipping Sauce - Signature|Dry Storage|Case:200,Each:1
Dipping Sauce - Scorchin Hot|Dry Storage|Case:200,Each:1
Dipping Sauce - Breakfast Syrup|Dry Storage|Case:200,Each:1
Sauce - Hot Cholula|Dry Storage|Case:200,Each:1
Packet - Ketchup|Dry Storage|Case:1944,Each:1
Packet - Mayonnaise|Dry Storage|Case:200,Each:1
Packet - Salt|Dry Storage|Case:6000,Bag:1000,Each:1
Packet - Pepper|Dry Storage|Case:6000,Bag:1000,Each:1
Packet - Mustard|Dry Storage|Case:500,Each:1
Packet - Sugar|Dry Storage|Case:2000,Each:1
Pouch - Mustard|Dry Storage|Case:8,Pouch:1
Pouch - Ketchup Bulk|Dry Storage|Case:20,Pouch:1
Pouch - Ketchup Fancy|Dry Storage|Case:4,Pouch:1
Coffee - Ground Regular RAC|Dry Storage|Case:92,Packet:1
Bun - Premium|Dry Storage|Tray:5,Bag:12,Each:1
Bun - Regular|Dry Storage|Tray:6,Bag:12,Each:1
Bun - Pretzel|Dry Storage|Case:96,Bag:12,Each:1
Biscuit|Dry Storage|Case:144,Tray:24,Each:1
Croissant Square Brk|Dry Storage|Case:180,Bag:6,Each:1
Flour Tortilla 10 in|Dry Storage|Case:192,Bag:12,Each:1
Cinnabon Pull-Apart|Dry Storage|Case:80,Tray:20,Each:1
Oreo Pieces|Dry Storage|Case:12,Bag:1
Toffee Pieces|Dry Storage|Case:10,Bag:1
Sugar Cane Syrup|Dry Storage|Bottle:1
Syrup - Monin Dark Chocolate|Dry Storage|Bottle:1
Syrup - Monin French Vanilla|Dry Storage|Bottle:1
Syrup - Sea Salt Caramel|Dry Storage|Case:4,Bottle:1
Seasoning Chili Hot Ind|Dry Storage|Case:504,Each:1
Lemonade - Base|Dry Storage|Case:6,Jug:1
Potatoes|Dry Storage|Case:80,Each:1
Bottled Water|Dry Storage|Case:35,Bottle:1
FS Coke|Dry Storage|Cartridge:1
FS Coke Zero|Dry Storage|Cartridge:1
FS Diet Coke|Dry Storage|Cartridge:1
FS Sprite/Zero|Dry Storage|Cartridge:1
FS Dr Pepper/Diet|Dry Storage|Cartridge:1
FS Fanta/Zero|Dry Storage|Cartridge:1
FS Orange|Dry Storage|Cartridge:1
FS Lemonade/Lite|Dry Storage|Cartridge:1
FS Vanilla|Dry Storage|Cartridge:1
FS Strawberry|Dry Storage|Cartridge:1
FS Grape|Dry Storage|Cartridge:1
FS Cherry|Dry Storage|Cartridge:1
FS Pineapple|Dry Storage|Cartridge:1
FS Peach|Dry Storage|Cartridge:1
FS Fruit Punch|Dry Storage|Cartridge:1
FS Hi-C|Dry Storage|Cartridge:1
FS Lime|Dry Storage|Cartridge:1
FS Cooling|Dry Storage|Cartridge:1
FS Vitaminwater Single|Dry Storage|Cartridge:1
Chicken - Breakfast & Crispy|Freezer|Case:204,Bag:34,Each:1
Chicken - Classic|Freezer|Case:102,Bag:17,Each:1
Chicken - Spicy|Freezer|Case:102,Bag:17,Each:1
Chicken - Tenders|Freezer|Case:198,Bag:33,Each:1
Chicken Nuggets|Freezer|Case:15,Bag:1
Chicken Nuggets Spicy|Freezer|Case:15,Bag:1
Potato Fry (French Fries)|Freezer|Case:6,Bag:1
Potatoes - Brkf Half-Moon|Freezer|Case:6,Bag:1
Sauce - Cheese Frz|Freezer|Case:16,Pouch:1
Gold Chili Bean|Freezer|Case:14,Pouch:1
Gold Chili Base|Freezer|Case:6,Pouch:1
Gold Chili Meat 5.25 Lb|Freezer|Bag:1
Eggs - Diced Frozen|Freezer|Case:6,Bag:1
French Toast Sticks|Freezer|Case:306,Each:1
Cookie Chocolate Chunk|Freezer|Case:107,Bag:26.75,Each:1
Cookie Sugar|Freezer|Case:107,Bag:26.75,Each:1
Cinnabon Icing|Freezer|Case:24,Pouch:1
Bun - Premium|Freezer|Tray:5,Bag:12,Each:1
Bun - Regular|Freezer|Tray:6,Bag:12,Each:1
Bun - Pretzel|Freezer|Case:96,Bag:12,Each:1
Biscuit|Freezer|Case:144,Tray:24,Each:1
Croissant Square Brk|Freezer|Case:180,Bag:6,Each:1
Sauce - Beer Cheese|Freezer|Case:33,Pouch:1
Flour Tortilla 10 in|Freezer|Case:192,Bag:12,Each:1
V-Supplies - FS Hi-C|V-Supplies|Cartridge:1`;
const CATALOG=ROWS.split('\n').map((row,i)=>{const [name,location,s]=row.split('|');return {id:String(i),name,location,units:Object.fromEntries(s.split(',').map(z=>{const [u,f]=z.split(':');return [u,Number(f)]}))}});
