import React from 'react';
import '@splidejs/react-splide/css';
import Banners from './Sections/Banners';
import Categories from './Sections/Categories';
import RecommendedProduct from './Sections/RecommendedProduct';
import OffersProducts from './Sections/OffersProducts';

const Home = () => {
  return (
    <div className="flex flex-col items-center w-screen">
      <Banners />
      <Categories />
      <RecommendedProduct />
      <OffersProducts />
    </div>
  );
};

export default Home;