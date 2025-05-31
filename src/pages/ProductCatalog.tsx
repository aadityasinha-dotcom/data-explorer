import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Star, Package, Grid, List, Filter } from 'lucide-react';
import styles from './ProductCatalog.module.css';

// Type definitions
interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  rating: number;
  thumbnail: string;
  category: string;
  brand?: string;
  stock?: number;
  images?: string[];
}

interface Category {
  slug: string;
  name: string;
  url: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'title-asc' | 'title-desc' | 'price-asc' | 'price-desc';

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('title-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  const productsPerPage = 12;

  // Memoized sort function to prevent unnecessary re-renders
  const sortProducts = useCallback((products: Product[], sortBy: SortBy): Product[] => {
    const [field, order] = sortBy.split('-') as [string, 'asc' | 'desc'];
    
    return [...products].sort((a, b) => {
      let aValue: string | number = field === 'price' ? a.price : a.title.toLowerCase();
      let bValue: string | number = field === 'price' ? b.price : b.title.toLowerCase();
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, []);

  // Fetch categories - this runs only once
  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        const response = await fetch('https://dummyjson.com/products/categories');
        const data: Category[] = await response.json();
        console.log(data);
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products - this runs when page, category changes
  useEffect(() => {
    const fetchProducts = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      
      try {
        const skip = (currentPage - 1) * productsPerPage;
        let url: string;
        
        if (selectedCategory === 'all') {
          url = `https://dummyjson.com/products?limit=${productsPerPage}&skip=${skip}`;
        } else {
          url = `https://dummyjson.com/products/category/${selectedCategory}?limit=${productsPerPage}&skip=${skip}`;
        }
        
        const response = await fetch(url);
        const data: ProductsResponse = await response.json();
        
        // Store raw products first
        setProducts(data.products);
        setTotalProducts(data.total);
      } catch (err) {
        setError('Failed to fetch products. Please try again.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, selectedCategory]); // Removed sortBy from dependencies

  // Separate effect for sorting products in memory
  const [sortedProducts, setSortedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (products.length > 0) {
      const sorted = sortProducts(products, sortBy);
      setSortedProducts(sorted);
    }
  }, [products, sortBy, sortProducts]);

  const handleCategoryChange = (category: string): void => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleSortChange = (newSortBy: SortBy): void => {
    setSortBy(newSortBy);
    // Don't reset page for sorting since it's client-side
  };

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const fetchProductDetails = async (productId: number): Promise<void> => {
    try {
      const response = await fetch(`https://dummyjson.com/products/${productId}`);
      const data: Product = await response.json();
      setSelectedProduct(data);
    } catch (err) {
      console.error('Error fetching product details:', err);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={styles.spinner}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <p className={styles.errorMessage}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.catalogContainer}>
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={styles.header}
      >
        <div className={styles.headerContent}>
          <div className={styles.headerInner}>
            <h1 className={styles.headerTitle}>Product Catalog</h1>
            
            <div className={styles.headerControls}>
              {/* View Mode Toggle */}
              <div className={styles.viewToggle}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                >
                  <List size={16} />
                </button>
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={styles.mobileFilterToggle}
              >
                <Filter size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`${styles.sidebar} ${showFilters ? styles.mobileVisible : ''}`}
          >
            <div className={styles.sidebarContent}>
              {/* Sort Options */}
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortBy)}
                  className={styles.sortSelect}
                >
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="price-asc">Price Low to High</option>
                  <option value="price-desc">Price High to Low</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Categories</h3>
                <div className={styles.filterOptions}>
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className={`${styles.filterOption} ${selectedCategory === 'all' ? styles.active : ''}`}
                  >
                    All Products
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.slug}
                      onClick={() => handleCategoryChange(category.slug)}
                      className={`${styles.filterOption} ${selectedCategory === category.slug ? styles.active : ''}`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              
            </div>
          </motion.aside>

          {/* Main Content */}
          <div className={styles.productsSection}>
            {/* Products Count */}
            <div className={styles.productsHeader}>
              <p className={styles.productsCount}>
                Showing {sortedProducts.length} of {totalProducts} products
              </p>
              {loading && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className={styles.miniSpinner}
                />
              )}
            </div>

            {/* Products Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={`${styles.productsGrid} ${styles[viewMode]}`}
            >
              {sortedProducts.map((product) => (
                <motion.div
                  key={product.id}
                  variants={cardVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={styles.productCard}
                  onClick={() => fetchProductDetails(product.id)}
                >
                  <div className={styles.productImageContainer}>
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className={styles.productImage}
                    />
                  </div>
                  
                  <div className={styles.productInfo}>
                    <h3 className={styles.productTitle}>{product.title}</h3>
                    <p className={styles.productDescription}>{product.description}</p>
                    <div className={styles.productFooter}>
                      <span className={styles.productPrice}>${product.price}</span>
                      <div className={styles.productRating}>
                        <Star className={styles.starIcon} />
                        <span className={styles.ratingText}>{product.rating}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.pagination}
              >
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={styles.paginationButton}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className={styles.paginationNumbers}>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`${styles.paginationNumber} ${currentPage === i + 1 ? styles.active : ''}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={styles.paginationButton}
                >
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{selectedProduct.title}</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className={styles.modalClose}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className={styles.modalBody}>
                <div className={styles.modalGrid}>
                  <div className={styles.modalImages}>
                    <img
                      src={selectedProduct.thumbnail}
                      alt={selectedProduct.title}
                      className={styles.modalMainImage}
                    />
                    {selectedProduct.images && selectedProduct.images.length > 1 && (
                      <div className={styles.modalThumbnailGrid}>
                        {selectedProduct.images.slice(1, 4).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt=""
                            className={styles.modalThumbnail}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.modalDetails}>
                    <div className={styles.modalPriceRating}>
                      <span className={styles.modalPrice}>${selectedProduct.price}</span>
                      <div className={styles.modalRating}>
                        <Star className={styles.modalStar} />
                        <span className={styles.modalRatingText}>{selectedProduct.rating}</span>
                      </div>
                    </div>
                    
                    <div className={styles.modalMeta}>
                      {selectedProduct.brand && <span>Brand: {selectedProduct.brand}</span>}
                      <span>Category: {selectedProduct.category}</span>
                    </div>
                    
                    {selectedProduct.stock && (
                      <div className={styles.modalStock}>
                        <Package className={styles.stockIcon} />
                        <span>{selectedProduct.stock} in stock</span>
                      </div>
                    )}
                    
                    <p className={styles.modalDescription}>{selectedProduct.description}</p>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={styles.addToCartButton}
                    >
                      Add to Cart
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductCatalog;
