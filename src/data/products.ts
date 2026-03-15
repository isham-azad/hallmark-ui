export interface Product {
    id: string;
    title: string;
    category: string;
    brand: string;
    desc: string;
    image?: string;
    price?: string;
}

export interface Brand {
    id: string;
    name: string;
    summary: string;
    image: string;
}

export interface Category {
    id: string;
    name: string;
    summary: string;
    image: string;
}

export const brands: Brand[] = [
    { id: "soph", name: "Soph", summary: "Soph offers a range of high-quality home care and fabric care products designed for effective cleaning and long-lasting freshness.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566353/hallmark/assets/img/clients/client-1.png" },
    { id: "emitol", name: "Emitol", summary: "Emitol specializes in powerful cleaning liquids that ensure a germ-free environment for your home.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566354/hallmark/assets/img/clients/client-2.png" },
    { id: "fabritt", name: "Fabritt", summary: "Fabritt provides premium fabric softeners that leave your clothes silky smooth and delicately scented.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566355/hallmark/assets/img/clients/client-3.png" },
    { id: "foline", name: "Foline", summary: "Foline is your go-to brand for versatile multipurpose cleaners and essential bleaching products.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566356/hallmark/assets/img/clients/client-4.png" },
    { id: "pdm-maharaja", name: "PDM Maharaja", summary: "PDM Maharaja brings you the finest selection of handpicked spices and dry fruits, preserving authentic flavors.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566357/hallmark/assets/img/clients/client-5.png" },
    { id: "vita-rich", name: "Vita Rich", summary: "Vita Rich offers a nutritious range of pulses, masala items, and daily staples for a healthy lifestyle.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566358/hallmark/assets/img/clients/client-6.png" },
    { id: "river-hill-tea", name: "River Hill Tea", summary: "River Hill Tea delivers a rich and bold flavor, making every cup a refreshing experience.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566359/hallmark/assets/img/clients/client-7.png" },
    { id: "desam", name: "Desam / ദേശം", summary: "Desam provides pure lamp oils and ritual essentials for your spiritual journey.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566360/hallmark/assets/img/clients/client-8.png" },
];

export const categories: Category[] = [
    { id: "home-care", name: "Home Care", summary: "Essential products for a clean and happy home.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg" },
    { id: "fabric-care", name: "Fabric Care", summary: "Gentle yet powerful care for all your favorite garments.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566377/hallmark/assets/img/masonry-portfolio/masonry-portfolio-2.jpg" },
    { id: "personal-care", name: "Personal Care", summary: "Refined products for your daily hygiene and well-being.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566379/hallmark/assets/img/masonry-portfolio/masonry-portfolio-3.jpg" },
    { id: "cleaning-liquids", name: "Cleaning Liquids", summary: "Specialized formulas for sparkling surfaces and deep cleaning.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566380/hallmark/assets/img/masonry-portfolio/masonry-portfolio-4.jpg" },
    { id: "fancy-supplies", name: "Fancy Supplies", summary: "A curated selection of high-quality essential supplies.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566381/hallmark/assets/img/masonry-portfolio/masonry-portfolio-5.jpg" },
    { id: "food-beverages", name: "Food & Beverages", summary: "Authentic tastes and healthy ingredients for your kitchen.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566382/hallmark/assets/img/masonry-portfolio/masonry-portfolio-6.jpg" },
    { id: "ritual-essentials", name: "Ritual Essentials", summary: "Purity and devotion in every product for your daily rituals.", image: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566383/hallmark/assets/img/masonry-portfolio/masonry-portfolio-7.jpg" },
];

export const products: Product[] = [
    {
        id: "soph-dishwash-liquid",
        title: "Soph Dishwash Liquid",
        category: "home-care",
        brand: "soph",
        desc: "Available in 250 ml, 500 ml, and 1-liter packs. Powerful grease-cutting and stain removal with refreshing lime, orange, and green apple fragrances."
    },
    {
        id: "soph-dishwash-cake",
        title: "Soph Dishwash Cake",
        category: "home-care",
        brand: "soph",
        desc: "This 200g dishwash cake delivers powerful cleaning for every home. Effortlessly removes grease and stains, keeps utensils germ-free, and ensures safe, hygienic washing."
    },
    {
        id: "emitol-toilet-cleaner",
        title: "Emitol Toilet Cleaner",
        category: "cleaning-liquids",
        brand: "emitol",
        desc: "Available in 250 ml, 500 ml, and 1-liter mega pack. Kills 99.9% of germs and bacteria with long-lasting freshness, keeping your toilet germ-free."
    },
    {
        id: "soph-handwash",
        title: "Soph Handwash",
        category: "personal-care",
        brand: "soph",
        desc: "Available in Aloe Vera, Lavender, and Coffee fragrances. Gentle yet powerful formula eliminates germs and bacteria for soft, refreshed hands."
    },
    {
        id: "soph-liquid-detergent",
        title: "Soph Liquid Detergent",
        category: "fabric-care",
        brand: "soph",
        desc: "Premium-quality detergent liquid that delivers powerful cleaning with gentle fabric care. Keeps clothes fresh, fragrant, and looking like new."
    },
    {
        id: "soph-washing-powder",
        title: "Soph Washing Powder",
        category: "fabric-care",
        brand: "soph",
        desc: "Richly perfumed and gentle on fabrics. Removes stains, dirt, and germs effectively while keeping colors bright and fabrics intact."
    },
    {
        id: "soph-detergent-cake",
        title: "Soph Detergent Cake",
        category: "fabric-care",
        brand: "soph",
        desc: "200g soap—economical yet exceptionally effective. Advanced formula removes stains, dirt, and germs, leaving your clothes fresh and vibrant."
    },
    {
        id: "fabritt-fabric-softener",
        title: "Fabritt Fabric Softener",
        category: "fabric-care",
        brand: "fabritt",
        desc: "Infuse your clothes with a long-lasting, soothing fragrance and silky-smooth freshness that lasts all day."
    },
    {
        id: "emitol-floor-cleaner",
        title: "Emitol Floor Cleaner",
        category: "cleaning-liquids",
        brand: "emitol",
        desc: "Available in Lavender, Lemon, Tulsi, and Jasmine fragrances. Reveals sparkling, polished-looking tiles and granite while eliminating germs."
    },
    {
        id: "foline-multipurpose-cleaner",
        title: "Foline Multipurpose Cleaner",
        category: "cleaning-liquids",
        brand: "foline",
        desc: "Foline is a versatile multipurpose cleaning liquid designed to tackle multiple surfaces around the home, delivering reliable cleaning power."
    },
    {
        id: "desam-lamp-oil",
        title: "Desam Lamp Oil",
        category: "ritual-essentials",
        brand: "desam",
        desc: "Your pure companion in prayer. Just a few drops bring a steady flame and a more divine connection with the Almighty."
    },
    {
        id: "maharaja-camphor",
        title: "Maharaja Camphor & RKT Agarbatti",
        category: "ritual-essentials",
        brand: "pdm-maharaja",
        desc: "Premium ritual essentials crafted for purity and devotion. Enhance every prayer with their calming fragrance and clean burn."
    },
    {
        id: "pdm-maharaja-spices",
        title: "PDM Maharaja Spices",
        category: "food-beverages",
        brand: "pdm-maharaja",
        desc: "Handpicked Mustard Seeds, Cumin Seeds, Fenugreek, and Black Pepper, carefully packed to preserve their rich aroma and 100% purity."
    },
    {
        id: "river-hill-tea",
        title: "River Hill Tea",
        category: "food-beverages",
        brand: "river-hill-tea",
        desc: "Perfect balance of boldness and taste. River Hill Tea delivers a rich, unique flavour that refreshes your senses with every sip."
    },
    {
        id: "vita-rich-pulses",
        title: "Vita Rich Pulses & Grains",
        category: "food-beverages",
        brand: "vita-rich",
        desc: "Carefully sourced Daal, Chana, Green Gram, and Rice Flakes—hygienically packed and free from insects, chemicals, and impurities."
    },
    {
        id: "foline-bleaching-powder",
        title: "Foline Bleaching Powder",
        category: "home-care",
        brand: "foline",
        desc: "Foline Bleaching Powder provides powerful whitening and disinfecting for home care. Ideal for laundry and surface hygiene."
    }
];
