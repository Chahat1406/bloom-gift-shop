import React, { useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Heart, Instagram, Menu,
  MessageCircle, Minus, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Star,
  Truck, UserRound, X,
} from "lucide-react";
import { categories, products } from "./data.js";

const money = (amount) => `₹${amount.toLocaleString("en-IN")}`;
const readStored = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

function Image({ src, alt, className = "", fallback }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <div className={`image-fallback ${className}`} role="img" aria-label={alt}><Sparkles size={25} /><span>{alt}</span></div>;
  }
  return <img className={className} src={src} alt={alt} loading="lazy" onError={(event) => {
    if (fallback && event.currentTarget.src !== new URL(fallback, window.location.href).href) {
      event.currentTarget.src = fallback;
    } else {
      setFailed(true);
    }
  }} />;
}

function App() {
  const [cart, setCart] = useState(() => readStored("bloom-cart", []));
  const [wishlist, setWishlist] = useState(() => readStored("bloom-wishlist", []));
  const [user, setUser] = useState(() => readStored("bloom-user", null) || readStored("bloom-session-user", null));
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(notify.timeout);
    notify.timeout = window.setTimeout(() => setToast(""), 2600);
  };
  const updateCart = (next) => {
    setCart(next);
    localStorage.setItem("bloom-cart", JSON.stringify(next));
  };
  const updateWishlist = (next) => {
    setWishlist(next);
    localStorage.setItem("bloom-wishlist", JSON.stringify(next));
  };
  const addToCart = (product, quantity = 1) => {
    const existing = cart.find((item) => item.id === product.id);
    updateCart(existing
      ? cart.map((item) => item.id === product.id ? { ...item, qty: item.qty + quantity } : item)
      : [...cart, { id: product.id, qty: quantity }]);
    notify(`${product.name} added to your bag`);
  };
  const toggleWishlist = (product) => {
    const saved = wishlist.includes(product.id);
    updateWishlist(saved ? wishlist.filter((id) => id !== product.id) : [...wishlist, product.id]);
    notify(saved ? "Removed from your wishlist" : "Saved to your wishlist");
  };
  const changeQuantity = (id, delta) => updateCart(cart
    .map((item) => item.id === id ? { ...item, qty: item.qty + delta } : item)
    .filter((item) => item.qty > 0));
  const removeFromCart = (id) => updateCart(cart.filter((item) => item.id !== id));
  const login = (account, remember = true) => {
    setUser(account);
    if (remember) {
      localStorage.setItem("bloom-user", JSON.stringify(account));
      sessionStorage.removeItem("bloom-session-user");
    } else {
      localStorage.removeItem("bloom-user");
      sessionStorage.setItem("bloom-session-user", JSON.stringify(account));
    }
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("bloom-user");
    sessionStorage.removeItem("bloom-session-user");
    notify("You have been signed out");
    navigate("/");
  };
  const shared = { cart, wishlist, user, addToCart, toggleWishlist, changeQuantity, removeFromCart, updateCart, updateWishlist, notify, login, logout };
  const cartCount = cart.reduce((total, item) => total + item.qty, 0);

  return (
    <>
      <div className="announcement"><Sparkles size={14} /> A little joy, delivered. Free shipping on orders over ₹1,999 <ArrowRight size={14} /></div>
      <header className="site-header">
        <div className="header-main shell">
          <button className="icon-button mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
          <Link className="brand" to="/" onClick={() => setMenuOpen(false)} aria-label="Bloom Gift Shop home">
            <span className="brand-mark">b<span>✿</span></span>
            <span className="brand-copy"><strong>BLOOM</strong><small>GIFT SHOP</small></span>
          </Link>
          <form className="header-search" onSubmit={(event) => {
            event.preventDefault();
            navigate(`/shop?search=${encodeURIComponent(new FormData(event.currentTarget).get("search"))}`);
          }}>
            <Search size={17} /><input name="search" placeholder="Find something lovely..." aria-label="Search gifts" /><button aria-label="Search"><ArrowRight size={17} /></button>
          </form>
          <div className="header-actions">
            <Link className="account-link" to={user ? "/profile" : "/login"}><UserRound size={19} /><span>{user ? "My account" : "Login / Join"}</span></Link>
            <Link className="header-icon" to="/wishlist" aria-label="Wishlist"><Heart size={20} /><span className="count-badge">{wishlist.length}</span></Link>
            <Link className="header-icon" to="/cart" aria-label="Shopping bag"><ShoppingBag size={20} /><span className="count-badge">{cartCount}</span></Link>
          </div>
        </div>
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
          <div className="shell nav-inner">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
            <NavLink to="/shop" onClick={() => setMenuOpen(false)}>Shop all</NavLink>
            <a href="/#categories" onClick={() => setMenuOpen(false)}>Categories</a>
            <NavLink to="/about" onClick={() => setMenuOpen(false)}>Our story</NavLink>
            <NavLink to="/gallery" onClick={() => setMenuOpen(false)}>Gallery</NavLink>
            <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
          </div>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home {...shared} />} />
          <Route path="/shop" element={<Shop {...shared} />} />
          <Route path="/product/:id" element={<ProductDetail {...shared} />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact notify={notify} />} />
          <Route path="/cart" element={<Cart {...shared} />} />
          <Route path="/wishlist" element={<Wishlist {...shared} />} />
          <Route path="/checkout" element={<Checkout {...shared} />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/login" element={<Auth mode="login" login={login} notify={notify} />} />
          <Route path="/register" element={<Auth mode="register" login={login} notify={notify} />} />
          <Route path="/profile" element={<Profile user={user} logout={logout} />} />
          <Route path="/privacy" element={<InfoPage type="privacy" />} />
          <Route path="/terms" element={<InfoPage type="terms" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </>
  );
}

function ProductCard({ product, addToCart, toggleWishlist, wishlist }) {
  const saved = wishlist.includes(product.id);
  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-image-wrap">
        <Image src={product.image} alt={product.name} className="product-image" />
        {product.tag && <span className="product-tag">{product.tag}</span>}
      </Link>
      <button className={`wish-button ${saved ? "is-saved" : ""}`} onClick={() => toggleWishlist(product)} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}><Heart size={17} fill={saved ? "currentColor" : "none"} /></button>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <Link to={`/product/${product.id}`} className="product-name">{product.name}</Link>
        <div className="product-price"><strong>{money(product.price)}</strong>{product.oldPrice && <del>{money(product.oldPrice)}</del>}</div>
        <button className="button button-outline product-add" onClick={() => addToCart(product)}><Plus size={16} /> Add to bag</button>
      </div>
    </article>
  );
}

function ProductGrid({ items, ...props }) {
  return <div className="product-grid">{items.map((product) => <ProductCard key={product.id} product={product} {...props} />)}</div>;
}

function SectionHeading({ eyebrow, title, copy, link, linkLabel = "Explore all" }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{copy && <p>{copy}</p>}</div>{link && <Link className="text-link" to={link}>{linkLabel}<ArrowRight size={16} /></Link>}</div>;
}

function Home(props) {
  const trending = products.filter((item) => item.tag === "Bestseller").slice(0, 4);
  const arrivals = products.filter((item) => item.tag === "New").slice(0, 4);
  return (
    <>
      <section className="hero shell">
        <Image src="/images/bloom-store-exterior.jpg" fallback="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85" alt="Bloom Gift Shop storefront" className="hero-image" />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="hero-kicker"><Sparkles size={15} /> LITTLE THINGS, BIG FEELINGS</span>
          <h1>Welcome to<br /><em>Bloom Gift Shop</em></h1>
          <p>Find the perfect gift for every special moment.</p>
          <Link className="button button-light" to="/shop">Shop now <ArrowRight size={17} /></Link>
          <span className="hero-script">Make every moment bloom.</span>
        </div>
        <div className="hero-note"><span>✿</span><div>Thoughtfully picked<br />Beautifully wrapped</div></div>
      </section>

      <section className="benefit-strip shell">
        <div><span className="benefit-icon"><Truck size={20} /></span><span><strong>Lovely things, delivered</strong><small>Free shipping over ₹1,999</small></span></div>
        <div><span className="benefit-icon"><ShieldCheck size={20} /></span><span><strong>A little extra care</strong><small>Every gift hand-checked</small></span></div>
        <div><span className="benefit-icon"><Heart size={20} /></span><span><strong>Made for your moment</strong><small>Personalise the perfect gift</small></span></div>
      </section>

      <section className="section shell" id="categories">
        <SectionHeading eyebrow="A gift for every feeling" title="What are we celebrating?" copy="Find just the right something for every lovely occasion." />
        <div className="category-grid">{categories.slice(0, 6).map((category) => <Link className="category-card" to={`/shop?category=${encodeURIComponent(category.name)}`} key={category.name}>
          <Image src={category.image} alt={category.name} className="category-image" />
          <span className="category-icon">{category.icon}</span><span className="category-title">{category.name}</span><ArrowRight className="category-arrow" size={17} />
        </Link>)}</div>
      </section>

      <section className="section section-tint">
        <div className="shell"><SectionHeading eyebrow="The ones you love most" title="Little crowd-pleasers" copy="Our most-loved picks, ready to make somebody smile." link="/shop" />
          <ProductGrid items={trending} {...props} />
        </div>
      </section>

      <section className="section shell">
        <SectionHeading eyebrow="Fresh from our little shop" title="New things to love" copy="Just arrived, wrapped up in all the good feelings." link="/shop?sort=newest" />
        <ProductGrid items={arrivals} {...props} />
      </section>

      <section className="occasion-band shell">
        <div className="occasion-copy"><span className="eyebrow">For the days that matter</span><h2>Make their<br /><em>day feel like theirs.</em></h2><p>Birthdays, anniversaries, just-because Tuesdays — a thoughtful gift says it all.</p><Link className="button button-dark" to="/shop">Find their gift <ArrowRight size={17} /></Link></div>
        <div className="occasion-photo"><Image src={products[5].image} alt="A beautifully arranged birthday gift hamper" /></div>
        <span className="occasion-sparkle sparkle-one">✳</span><span className="occasion-sparkle sparkle-two">✿</span>
      </section>

      <section className="promo-band"><div className="promo-content"><span>THE JOY OF GIVING, ON US</span><h2>A little more love<br />in every box.</h2><p>Enjoy 10% off your first order with <strong>HELLOBLOOM</strong></p><Link className="button button-light" to="/shop">Find your something <ArrowRight size={16} /></Link></div><div className="promo-decoration">✿</div></section>

      <section className="section reviews-section">
        <div className="shell"><SectionHeading eyebrow="Notes from our happy people" title="A little love, returned" />
          <div className="review-grid">{[
            ["“The sweetest little hamper! It arrived wrapped so beautifully, and my sister absolutely loved it.”", "Ananya R.", "Birthday gifting"],
            ["“Found the perfect anniversary gift without the last-minute panic. The photo lamp made us both tear up!”", "Kavya M.", "Anniversary gifting"],
            ["“You can feel the care in every detail. This is now my go-to place for every celebration.”", "Ishita P.", "A regular bloom friend"],
          ].map(([quote, name, occasion]) => <article className="review-card" key={name}><div className="stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={15} fill="currentColor" />)}</div><p>{quote}</p><strong>{name}</strong><small>{occasion}</small></article>)}</div>
        </div>
      </section>

      <Newsletter notify={props.notify} />
    </>
  );
}

function Shop({ addToCart, toggleWishlist, wishlist }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All gifts");
  const [sort, setSort] = useState(searchParams.get("sort") || "featured");
  const filtered = useMemo(() => {
    let result = products.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === "All gifts" || product.category === category));
    if (sort === "price-low") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-high") result = [...result].sort((a, b) => b.price - a.price);
    if (sort === "newest") result = [...result].sort((a, b) => Number(Boolean(b.tag === "New")) - Number(Boolean(a.tag === "New")));
    if (sort === "popular") result = [...result].sort((a, b) => Number(Boolean(b.tag === "Bestseller")) - Number(Boolean(a.tag === "Bestseller")));
    return result;
  }, [search, category, sort]);
  const setFilter = (key, value) => {
    if (key === "category") setCategory(value);
    if (key === "search") setSearch(value);
    if (key === "sort") setSort(value);
    const next = new URLSearchParams(searchParams);
    if (value && value !== "All gifts" && value !== "featured") next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };
  return <div className="page-shell shell">
    <div className="page-intro"><span className="eyebrow">A little something for everyone</span><h1>Shop all the lovely things</h1><p>Thoughtful gifts, picked with love and ready to make their day.</p></div>
    <div className="shop-tools"><label className="shop-search"><Search size={17} /><input placeholder="Search gifts..." value={search} onChange={(e) => setFilter("search", e.target.value)} /><button type="button" onClick={() => setFilter("search", "")} aria-label="Clear search">{search && <X size={16} />}</button></label>
      <label className="select-wrap"><span>Category</span><select value={category} onChange={(e) => setFilter("category", e.target.value)}><option>All gifts</option>{categories.map((item) => <option key={item.name}>{item.name}</option>)}</select><ChevronDown size={16} /></label>
      <label className="select-wrap"><span>Sort by</span><select value={sort} onChange={(e) => setFilter("sort", e.target.value)}><option value="featured">Featured</option><option value="popular">Most popular</option><option value="newest">Newest arrivals</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><ChevronDown size={16} /></label>
    </div>
    <div className="results-line"><span>{filtered.length} lovely {filtered.length === 1 ? "find" : "finds"}</span>{category !== "All gifts" && <button className="clear-filter" onClick={() => setFilter("category", "All gifts")}>{category} <X size={13} /></button>}</div>
    {filtered.length ? <ProductGrid items={filtered} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} /> : <EmptyState title="Nothing blooming just yet" copy="Try a different search or browse all of our lovely gifts." action="Browse all gifts" to="/shop" />}
  </div>;
}

function ProductDetail({ addToCart, toggleWishlist, wishlist }) {
  const { id } = useParams();
  const product = products.find((item) => item.id === Number(id));
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  if (!product) return <NotFound />;
  return <div className="shell page-shell detail-page"><Link to="/shop" className="back-link"><ArrowLeft size={16} /> Back to all gifts</Link>
    <div className="detail-layout"><div className="detail-image"><Image src={product.image} alt={product.name} /></div><div className="detail-copy">
      <span className="eyebrow">{product.category}</span><h1>{product.name}</h1><div className="detail-rating"><span className="stars"><Star size={15} fill="currentColor" /><Star size={15} fill="currentColor" /><Star size={15} fill="currentColor" /><Star size={15} fill="currentColor" /><Star size={15} fill="currentColor" /></span> Thoughtfully loved by our customers</div>
      <div className="detail-price">{money(product.price)} {product.oldPrice && <del>{money(product.oldPrice)}</del>}</div><p>{product.description}</p>
      <div className="detail-points"><span><Check size={16} /> Beautifully gift-wrapped</span><span><Check size={16} /> A little note, on us</span><span><Check size={16} /> Ships with care from our store</span></div>
      <div className="detail-buy"><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={15} /></button><span>{qty}</span><button aria-label="Increase quantity" onClick={() => setQty(qty + 1)}><Plus size={15} /></button></div><button className="button button-dark" onClick={() => { addToCart(product, qty); setAdded(true); window.setTimeout(() => setAdded(false), 1800); }}><ShoppingBag size={17} />{added ? "Added to your bag" : "Add to bag — " + money(product.price * qty)}</button></div>
      <button className="detail-wish" onClick={() => toggleWishlist(product)}><Heart size={17} fill={wishlist.includes(product.id) ? "currentColor" : "none"} />{wishlist.includes(product.id) ? "Saved to your wishlist" : "Add to wishlist"}</button>
      <div className="detail-note"><span>✿</span><span><strong>A gift that feels like you.</strong><small>Need a hand choosing? We'd love to help.</small></span></div>
    </div></div>
    <section className="section"><SectionHeading eyebrow="You might also love" title="More little joys" link="/shop" /><ProductGrid items={products.filter((item) => item.id !== product.id).slice(0, 4)} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} /></section>
  </div>;
}

function Cart({ cart, addToCart, changeQuantity, removeFromCart }) {
  const items = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.id) })).filter((item) => item.product);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const delivery = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
  return <div className="shell page-shell">
    <div className="page-intro compact-intro"><span className="eyebrow">Your lovely little collection</span><h1>Your shopping bag</h1><p>{items.length ? "A few thoughtful things, almost ready to go." : "Your bag is waiting for something lovely."}</p></div>
    {items.length ? <div className="cart-layout"><div className="cart-items">{items.map(({ product, qty }) => <article className="cart-item" key={product.id}><Link to={`/product/${product.id}`}><Image src={product.image} alt={product.name} /></Link><div className="cart-item-copy"><Link to={`/product/${product.id}`} className="product-name">{product.name}</Link><span>{product.category}</span><strong>{money(product.price)}</strong><div className="quantity-control"><button aria-label={`Decrease ${product.name} quantity`} onClick={() => changeQuantity(product.id, -1)}><Minus size={14} /></button><span>{qty}</span><button aria-label={`Increase ${product.name} quantity`} onClick={() => changeQuantity(product.id, 1)}><Plus size={14} /></button></div></div><div className="cart-item-end"><strong>{money(product.price * qty)}</strong><button className="remove-button" onClick={() => removeFromCart(product.id)}>Remove</button></div></article>)}
      <Link className="text-link continue-link" to="/shop"><ArrowLeft size={16} /> Keep browsing</Link></div>
      <aside className="summary-card"><h2>Order summary</h2><div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="summary-row"><span>Delivery</span><strong>{delivery ? money(delivery) : "On us"}</strong></div><div className="free-ship-note">{subtotal >= 1999 ? "Your delivery is on us — lovely!" : `Add ${money(Math.max(0, 1999 - subtotal))} more for complimentary delivery.`}</div><div className="summary-total"><span>Total</span><strong>{money(subtotal + delivery)}</strong></div><Link className="button button-dark button-full" to="/checkout">Continue to checkout <ArrowRight size={17} /></Link><p className="secure-note"><ShieldCheck size={15} /> Secure checkout · Demo store, no real payments</p></aside>
    </div> : <EmptyState title="Your bag could use a little bloom" copy="Pick something thoughtful and we'll keep it safe here." action="Explore gifts" to="/shop" />}
  </div>;
}

function Wishlist({ wishlist, toggleWishlist, addToCart }) {
  const items = products.filter((product) => wishlist.includes(product.id));
  const moveToBag = (product) => { addToCart(product); toggleWishlist(product); };
  return <div className="shell page-shell"><div className="page-intro compact-intro"><span className="eyebrow">Saved with love</span><h1>Your wishlist</h1><p>All the lovely things you might make someone's day with.</p></div>
    {items.length ? <div className="wishlist-grid">{items.map((product) => <article className="wishlist-card" key={product.id}><Link to={`/product/${product.id}`}><Image src={product.image} alt={product.name} /></Link><button className="wish-remove" onClick={() => toggleWishlist(product)} aria-label={`Remove ${product.name} from wishlist`}><X size={17} /></button><span className="product-category">{product.category}</span><Link to={`/product/${product.id}`} className="product-name">{product.name}</Link><div className="product-price"><strong>{money(product.price)}</strong></div><button className="button button-dark button-full" onClick={() => moveToBag(product)}><ShoppingBag size={16} /> Move to bag</button></article>)}</div> : <EmptyState title="A little room for a little love" copy="Tap the heart on anything you fancy and find it here later." action="Find something lovely" to="/shop" />}
  </div>;
}

function Checkout({ cart, user, updateCart, notify }) {
  const navigate = useNavigate();
  const [payment, setPayment] = useState("cod");
  const items = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.id) })).filter((item) => item.product);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const delivery = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
  if (!items.length) return <div className="shell page-shell"><EmptyState title="Your bag is looking a little light" copy="Add a lovely gift before heading to checkout." action="Explore gifts" to="/shop" /></div>;
  const placeOrder = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const orderId = `BLM${Date.now().toString().slice(-7)}`;
    localStorage.setItem("bloom-last-order", JSON.stringify({ orderId, name: form.get("name"), total: subtotal + delivery }));
    updateCart([]);
    navigate("/order-confirmation");
  };
  return <div className="shell page-shell checkout-page"><div className="page-intro compact-intro"><span className="eyebrow">Nearly there</span><h1>Let's make it theirs.</h1><p>Share where to send your little bit of joy.</p></div>
    <form className="checkout-layout" onSubmit={placeOrder}><div className="checkout-fields"><section className="form-panel"><h2>Delivery details</h2><div className="form-grid"><label>Full name<input name="name" defaultValue={user?.name || ""} autoComplete="name" required placeholder="Your full name" /></label><label>Mobile number<input name="phone" type="tel" pattern="[0-9+()\s\-]{8,15}" autoComplete="tel" required placeholder="+91 98765 43210" /></label><label className="span-two">Delivery address<textarea name="address" autoComplete="street-address" rows="3" required placeholder="House, street, area and a helpful landmark" /></label><label>City<input name="city" autoComplete="address-level2" required placeholder="Your city" /></label><label>State<input name="state" autoComplete="address-level1" required placeholder="Your state" /></label><label>PIN code<input name="pin" inputMode="numeric" pattern="[0-9]{6}" autoComplete="postal-code" required placeholder="6-digit PIN code" /></label></div></section>
      <section className="form-panel"><h2>How would you like to pay?</h2><label className={`payment-option ${payment === "cod" ? "selected" : ""}`}><input type="radio" name="payment" value="cod" checked={payment === "cod"} onChange={() => setPayment("cod")} /><span><strong>Cash on Delivery</strong><small>Pay when your gift arrives. No online payment is taken.</small></span><span className="radio-dot" /></label><label className={`payment-option ${payment === "demo" ? "selected" : ""}`}><input type="radio" name="payment" value="demo" checked={payment === "demo"} onChange={() => setPayment("demo")} /><span><strong>Pay on delivery</strong><small>Demo checkout only — no real payment processing.</small></span><span className="radio-dot" /></label></section>
      </div><aside className="summary-card checkout-summary"><h2>Your gifts</h2>{items.map(({ product, qty }) => <div className="checkout-item" key={product.id}><Image src={product.image} alt={product.name} /><span>{product.name}<small>Qty {qty}</small></span><strong>{money(product.price * qty)}</strong></div>)}<div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="summary-row"><span>Delivery</span><strong>{delivery ? money(delivery) : "On us"}</strong></div><div className="summary-total"><span>Total</span><strong>{money(subtotal + delivery)}</strong></div><button className="button button-dark button-full" type="submit">Place demo order <ArrowRight size={17} /></button><p className="secure-note"><ShieldCheck size={15} /> This demo does not process payments</p></aside></form>
  </div>;
}

function OrderConfirmation() {
  const order = readStored("bloom-last-order", null);
  return <div className="shell page-shell confirmation-page"><div className="confirmation-icon"><Check size={35} /></div><span className="eyebrow">A little joy is on its way</span><h1>Thank you, {order?.name?.split(" ")[0] || "lovely"}!</h1><p>Your demo order has been placed. We hope it makes their day bloom.</p>{order && <div className="order-reference"><span>Demo order number</span><strong>{order.orderId}</strong><span>Order total · {money(order.total)}</span></div>}<p className="demo-disclaimer">This is a frontend demonstration. No real payment was processed and no order was sent to a store.</p><Link className="button button-dark" to="/shop">Find another little joy <ArrowRight size={16} /></Link></div>;
}

function Auth({ mode, login, notify }) {
  const isRegister = mode === "register";
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));
    if (isRegister && password !== form.get("confirmPassword")) {
      setError("Those passwords don't match just yet.");
      return;
    }
    if (isRegister) {
      const account = { name: String(form.get("name")).trim(), email, phone: String(form.get("phone")).trim(), password };
      localStorage.setItem("bloom-account", JSON.stringify(account));
      login({ name: account.name, email: account.email, phone: account.phone }, form.get("remember") === "on");
      notify("Welcome to the Bloom family!");
      navigate("/profile");
      return;
    }
    const account = readStored("bloom-account", null);
    if (!account || account.email !== email || account.password !== password) {
      setError("We couldn't find a matching account. Please check your details or join us.");
      return;
    }
    login({ name: account.name, email: account.email, phone: account.phone });
    notify("Welcome back!");
    navigate("/profile");
  };
  return <div className="auth-page shell"><div className="auth-card"><div className="auth-flower">✿</div><span className="eyebrow">{isRegister ? "A little joy, on repeat" : "Lovely to see you again"}</span><h1>{isRegister ? "Join the Bloom family" : "Welcome back"}</h1><p>{isRegister ? "Save your favourites and make every gifting moment a little easier." : "Sign in to find your saved gifts and account details."}</p>
    <form onSubmit={submit} className="stacked-form">{isRegister && <><label>Full name<input name="name" autoComplete="name" required minLength="2" placeholder="How should we call you?" /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" required pattern="[0-9+()\s\-]{8,15}" placeholder="+91 98765 43210" /></label></>}
      <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
      <label>Password<div className="password-input"><input name="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} required minLength="6" placeholder="At least 6 characters" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div></label>
      {isRegister && <label>Confirm password<input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength="6" placeholder="One more time" /></label>}
      {!isRegister && <label className="remember-label"><input type="checkbox" name="remember" /> Remember me</label>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-dark button-full">{isRegister ? "Create my account" : "Sign in"} <ArrowRight size={17} /></button>
    </form><div className="auth-switch">{isRegister ? "Already part of the family?" : "New around here?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link></div><small className="privacy-note">Demo sign-in uses local storage on this device only.</small></div></div>;
}

function Profile({ user, logout }) {
  if (!user) return <div className="shell page-shell"><EmptyState title="Your Bloom account is waiting" copy="Sign in or join the Bloom family to find your saved details here." action="Sign in" to="/login" /><p className="center-note">New to Bloom? <Link to="/register">Create your account</Link></p></div>;
  return <div className="shell page-shell profile-page"><div className="page-intro compact-intro"><span className="eyebrow">Your little corner</span><h1>Hello, {user.name.split(" ")[0]}.</h1><p>All your Bloom details, together in one place.</p></div><section className="profile-card"><div className="profile-avatar">{user.name[0]?.toUpperCase()}</div><div><h2>{user.name}</h2><p>{user.email}</p><p>{user.phone || "Add a phone number next time you check out"}</p></div><button className="button button-outline" onClick={logout}>Sign out</button></section><div className="profile-shortcuts"><Link to="/wishlist"><Heart size={20} /><span><strong>Your wishlist</strong><small>All the things you saved for later</small></span><ArrowRight size={17} /></Link><Link to="/shop"><ShoppingBag size={20} /><span><strong>Find a little joy</strong><small>Browse our thoughtful gift collection</small></span><ArrowRight size={17} /></Link></div></div>;
}

function About() {
  return <div className="about-page"><section className="page-banner shell"><span className="eyebrow">A little shop with a lot of heart</span><h1>Thoughtful gifting<br /><em>is our love language.</em></h1><p>We believe the best gifts don't have to be grand. They just have to feel like you.</p></section>
    <section className="story-section shell"><div className="story-image"><Image src="/images/bloom-store-interior-teddies.jpg" fallback={products[0].image} alt="Soft toys and teddy bears at Bloom Gift Shop" /></div><div className="story-copy"><span className="eyebrow">How it all began</span><h2>A little idea,<br /><em>wrapped with love.</em></h2><p>Bloom began with one simple thought: finding a thoughtful gift should feel as lovely as giving one. So we filled our little shop with the things that made us smile — soft toys, thoughtful keepsakes, warm little home accents and plenty of lovely wrapping paper.</p><p>Today, every piece in our collection is still picked with the same care. We’re here for the big birthdays, the just-because moments, the weddings, and all the Tuesdays in between.</p><Link className="text-link" to="/shop">Find your something <ArrowRight size={16} /></Link></div></section>
    <section className="mission-band"><span className="eyebrow">A little more about us</span><h2>Our mission is simple.</h2><p>To help you make somebody feel truly thought of — with thoughtful finds, beautiful details, and a little Bloom magic in every parcel.</p></section>
    <section className="story-section story-reverse shell"><div className="story-image"><Image src="/images/bloom-store-interior-frames.jpg" fallback={products[6].image} alt="Decorative items and photo frames at Bloom Gift Shop" /></div><div className="story-copy"><span className="eyebrow">Why bloom with us?</span><h2>Good gifts.<br /><em>Even better feelings.</em></h2><ul className="about-list"><li><Check /> Thoughtfully chosen, quality finds</li><li><Check /> Collections for every kind of moment</li><li><Check /> Beautifully wrapped, always</li><li><Check /> A real little shop that truly cares</li><li><Check /> Customer happiness, from hello to delivery</li></ul></div></section>
    <section className="values-grid shell">{[["✿", "Good things, picked well", "We choose each piece for its quality, character and that little spark of joy."], ["🎁", "Every detail matters", "From a handwritten note to the last curl of ribbon, we make gifting feel special."], ["♡", "People come first", "Real care from a real little shop. We’re here whenever you need a hand."]].map(([icon, title, body]) => <article key={title}><span>{icon}</span><h3>{title}</h3><p>{body}</p></article>)}</section><Newsletter /></div>;
}

function Gallery() {
  const images = [
    { src: "/images/bloom-store-exterior.jpg", fallback: products[2].image, label: "Our little store" },
    ...products.slice(0, 11).map((product) => ({ src: product.image, label: product.name })),
    { src: "/images/bloom-store-interior-teddies.jpg", fallback: products[0].image, label: "The soft-toy corner" },
    ...products.slice(11, 19).map((product) => ({ src: product.image, label: product.name })),
    { src: "/images/bloom-store-interior-frames.jpg", fallback: products[6].image, label: "Thoughtful little details" },
    ...products.slice(19, 30).map((product) => ({ src: product.image, label: product.name })),
  ];
  return <div className="shell page-shell gallery-page"><div className="page-intro"><span className="eyebrow">A peek inside our world</span><h1>A little Bloom inspiration</h1><p>Lovely gifts, happy details and corners of our little shop.</p></div><div className="gallery-grid">{images.map((item, index) => <figure className={`gallery-tile gallery-tile-${index % 7}`} key={`${item.label}-${index}`}><Image src={item.src} fallback={item.fallback} alt={item.label} /><figcaption>{item.label}</figcaption></figure>)}</div></div>;
}

function Contact({ notify }) {
  const [sent, setSent] = useState(false);
  return <div className="shell page-shell contact-page"><div className="page-intro"><span className="eyebrow">We're right here</span><h1>Let's have a little chat.</h1><p>Need a hand finding the right gift? We’d love to help you make their day.</p></div><div className="contact-layout"><form className="form-panel contact-form" onSubmit={(event) => { event.preventDefault(); event.currentTarget.reset(); setSent(true); notify("Your note is ready for our little team"); }}><h2>Send us a note</h2><label>Your name<input name="name" required placeholder="Your name" /></label><label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>Phone number <span className="optional">(optional)</span><input name="phone" type="tel" placeholder="+91 98765 43210" /></label><label>Your message<textarea name="message" rows="5" required placeholder="Tell us what’s on your mind..." /></label>{sent && <p className="success-message"><Check size={16} /> Thank you! Your message has been noted in this demo.</p>}<button className="button button-dark">Send your note <ArrowRight size={16} /></button></form>
      <div className="contact-side"><article><span className="contact-icon">✿</span><div><h3>Come say hello</h3><p>123 Blossom Lane<br />Your neighbourhood, India<br /><small>(Store address placeholder)</small></p></div></article><article><span className="contact-icon">@</span><div><h3>Drop us a line</h3><p>hello@bloomgiftshop.in<br />+91 98765 43210</p></div></article><article><span className="contact-icon"><MessageCircle size={21} /></span><div><h3>Our little hours</h3><p>Monday – Saturday<br />10:00 am – 7:00 pm</p></div></article><div className="map-placeholder"><span>✿</span><strong>Your little neighbourhood shop</strong><small>Map location placeholder</small><span className="map-pin">♥</span></div><div className="social-row"><span>Say hello on socials</span><a href="https://instagram.com" aria-label="Instagram"><Instagram size={18} /></a><a href="https://facebook.com" aria-label="Facebook">f</a><a href="https://wa.me/" aria-label="WhatsApp"><MessageCircle size={18} /></a></div></div></div></div>;
}

function InfoPage({ type }) {
  const isPrivacy = type === "privacy";
  return <div className="shell page-shell info-page">
    <div className="page-intro"><span className="eyebrow">The small print, in plain words</span><h1>{isPrivacy ? "Privacy, with care." : "A few kind ground rules."}</h1><p>{isPrivacy ? "A quick note about what this little demo does with your details." : "What to expect while exploring the Bloom Gift Shop demo."}</p></div>
    <article className="info-copy">
      {isPrivacy ? <>
        <h2>Your information stays in this browser</h2><p>This is a frontend demonstration. Account details, cart contents, wishlist items and demo order references are stored in your browser’s local storage; they are not sent to a Bloom server.</p>
        <h2>Demo account details</h2><p>Registration is simulated for demonstration purposes. Avoid using a real password or sensitive personal information. You can sign out and clear this site’s browser storage to remove locally saved demo data.</p>
        <h2>Messages and subscriptions</h2><p>Contact form messages and newsletter sign-ups only show an on-screen demo confirmation. They are not delivered to a store or added to a mailing list.</p>
      </> : <>
        <h2>A storefront demonstration</h2><p>This website demonstrates a gift-shopping experience. Product details, prices, availability, delivery estimates and store contact information are illustrative and may not represent a real shop.</p>
        <h2>Orders and payments</h2><p>Checkout creates a local demo confirmation only. No order is sent to a retailer, no payment is collected and no real delivery is arranged.</p>
        <h2>Images and product details</h2><p>Product photography is illustrative. Store photographs can be added to the image paths shown in the project; until then, the interface uses sample photography and built-in visual fallbacks.</p>
      </>}
      <Link to="/shop" className="text-link">Back to the lovely things <ArrowRight size={16} /></Link>
    </article>
  </div>;
}

function Newsletter({ notify = () => {} }) {
  const [subscribed, setSubscribed] = useState(false);
  return <section className="newsletter"><div className="newsletter-inner"><span className="newsletter-flower">✿</span><div><span className="eyebrow">A little note from Bloom</span><h2>Lovely things, straight to your inbox.</h2><p>First dibs on new finds, gifting ideas and a little treat for joining us.</p></div><form onSubmit={(event) => { event.preventDefault(); setSubscribed(true); notify("You're on the list — lovely to have you!"); }}><label className="sr-only" htmlFor="newsletter-email">Your email address</label><input id="newsletter-email" type="email" placeholder="Your email address" required /><button className="button button-dark">{subscribed ? "You're on the list!" : "Count me in"} <ArrowRight size={16} /></button><small>No spam, ever. Just the good stuff.</small></form></div></section>;
}

function EmptyState({ title, copy, action, to }) {
  return <div className="empty-state"><span>✿</span><h2>{title}</h2><p>{copy}</p>{action && <Link className="button button-dark" to={to}>{action} <ArrowRight size={16} /></Link>}</div>;
}

function NotFound() {
  return <div className="shell page-shell"><EmptyState title="This little corner hasn't bloomed yet" copy="That page may have wandered off. Let's find you something lovely instead." action="Back to the shop" to="/shop" /></div>;
}

function Footer() {
  return <footer className="site-footer"><div className="shell"><div className="footer-main">
    <div className="footer-brand"><Link className="brand" to="/"><span className="brand-mark">b<span>✿</span></span><span className="brand-copy"><strong>BLOOM</strong><small>GIFT SHOP</small></span></Link><p>Thoughtful gifts for all the little and big moments. Make every moment bloom.</p><div className="footer-social"><a href="https://instagram.com" aria-label="Instagram"><Instagram size={17} /></a><a href="https://facebook.com" aria-label="Facebook">f</a><a href="https://wa.me/" aria-label="WhatsApp"><MessageCircle size={17} /></a></div></div>
    <div className="footer-column"><h3>Say hello</h3><Link to="/">Home</Link><Link to="/shop">Shop all gifts</Link><Link to="/about">Our story</Link><Link to="/gallery">Gallery</Link><Link to="/contact">Contact us</Link></div>
    <div className="footer-column"><h3>Here to help</h3><Link to="/contact">Get in touch</Link><Link to="/profile">Your account</Link><Link to="/cart">Shopping bag</Link><Link to="/wishlist">Wishlist</Link><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms & conditions</Link></div>
    <div className="footer-column"><h3>Shop by feeling</h3><Link to="/shop?category=Birthday%20Gifts">Birthday gifts</Link><Link to="/shop?category=Anniversary%20Gifts">Anniversary gifts</Link><Link to="/shop?category=Wedding%20Gifts">Wedding gifts</Link><Link to="/shop?category=Flowers%20%26%20Bouquets">Flowers & bouquets</Link><Link to="/shop?category=Personalized%20Gifts">Personalised gifts</Link></div>
  </div><div className="footer-bottom"><span>© {new Date().getFullYear()} Bloom Gift Shop. Made with a little love.</span><span><Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms & conditions</Link></span><span>Thoughtful gifting, right here in India <span className="india-flag">♥</span></span></div></div></footer>;
}

export default App;
