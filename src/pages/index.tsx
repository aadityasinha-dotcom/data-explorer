// pages/index.tsx
import React from 'react';
import Head from 'next/head';
import ProductCatalog from './ProductCatalog';

const HomePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Product Catalog - NextJS Store</title>
        <meta name="description" content="Browse our amazing product catalog with filtering and sorting options" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <ProductCatalog />
    </>
  );
};

export default HomePage;
