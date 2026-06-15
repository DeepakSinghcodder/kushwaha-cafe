document.addEventListener('DOMContentLoaded', () => {
    // ----------------- FLASH MESSAGES AUTO-CLOSE -----------------
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(msg => {
        const closeBtn = msg.querySelector('.flash-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => msg.remove());
        }
        // Auto remove after 4 seconds
        setTimeout(() => {
            msg.style.opacity = '0';
            msg.style.transform = 'translateX(50px)';
            msg.style.transition = 'all 0.5s ease';
            setTimeout(() => msg.remove(), 500);
        }, 4000);
    });

    // ----------------- LOGIN / REGISTER SWITCHING -----------------
    const authTabs = document.querySelectorAll('.auth-tab');
    if (authTabs.length > 0) {
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.target;
                
                // Toggle active class on tabs
                authTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Toggle active class on forms
                document.querySelectorAll('.auth-form').forEach(form => {
                    form.classList.remove('active');
                });
                document.getElementById(`${target}-form`).classList.add('active');
            });
        });
    }

    // ----------------- SHOPPING CART STATE MANAGEMENT -----------------
    let cart = JSON.parse(localStorage.getItem('cafe_cart')) || [];
    
    // Select cart elements
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountBadge = document.getElementById('cart-badge');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartGstEl = document.getElementById('cart-gst');
    const cartTotalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    // Function to save cart to localStorage
    const saveCart = () => {
        localStorage.setItem('cafe_cart', JSON.stringify(cart));
        updateCartBadge();
    };

    // Update cart count badge in navbar (if present)
    const updateCartBadge = () => {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountBadge) {
            cartCountBadge.textContent = totalItems;
            cartCountBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
        const panelCountBadge = document.querySelector('.cart-count-badge');
        if (panelCountBadge) {
            panelCountBadge.textContent = totalItems;
        }
    };

    // Render cart sidebar on menu page
    const renderCart = () => {
        if (!cartItemsContainer) return; // Not on Menu page
        
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div style="text-align: center; color: #718096; margin-top: 3rem;">
                    <span style="font-size: 3rem; display: block; margin-bottom: 1rem;">🛒</span>
                    Your cart is empty. Add some delicious items!
                </div>
            `;
            if (cartSubtotalEl) cartSubtotalEl.textContent = 'INR 0.00';
            if (cartGstEl) cartGstEl.textContent = 'INR 0.00';
            if (cartTotalEl) cartTotalEl.textContent = 'INR 0.00';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }
        
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="cart-item-detail">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">INR ${item.price.toFixed(2)}</div>
                    <div class="cart-item-qty">
                        <button class="qty-btn dec-qty" data-id="${item.id}">-</button>
                        <span class="qty-number">${item.quantity}</span>
                        <button class="qty-btn inc-qty" data-id="${item.id}">+</button>
                        <button class="cart-item-remove" data-id="${item.id}">Remove</button>
                    </div>
                </div>
                <div style="font-weight: 600; font-size: 0.95rem;">
                    INR ${itemTotal.toFixed(2)}
                </div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });
        
        const gst = subtotal * 0.05; // 5% GST
        const total = subtotal + gst;
        
        if (cartSubtotalEl) cartSubtotalEl.textContent = `INR ${subtotal.toFixed(2)}`;
        if (cartGstEl) cartGstEl.textContent = `INR ${gst.toFixed(2)}`;
        if (cartTotalEl) cartTotalEl.textContent = `INR ${total.toFixed(2)}`;
        if (checkoutBtn) checkoutBtn.disabled = false;
        
        // Bind item control events
        document.querySelectorAll('.inc-qty').forEach(btn => {
            btn.addEventListener('click', () => updateQuantity(parseInt(btn.dataset.id), 1));
        });
        
        document.querySelectorAll('.dec-qty').forEach(btn => {
            btn.addEventListener('click', () => updateQuantity(parseInt(btn.dataset.id), -1));
        });
        
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
        });
    };

    // Add item to cart
    const addToCart = (id, name, price) => {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }
        saveCart();
        renderCart();
        showNotification(`${name} added to cart!`, 'success');
    };

    // Update item quantity
    const updateQuantity = (id, change) => {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeFromCart(id);
                return;
            }
            saveCart();
            renderCart();
        }
    };

    // Remove item from cart
    const removeFromCart = (id) => {
        const item = cart.find(item => item.id === id);
        cart = cart.filter(item => item.id !== id);
        saveCart();
        renderCart();
        if (item) {
            showNotification(`${item.name} removed from cart.`, 'info');
        }
    };

    // Show temporary JS notifications
    const showNotification = (message, type = 'success') => {
        const container = document.querySelector('.flash-messages') || (() => {
            const div = document.createElement('div');
            div.className = 'flash-messages';
            document.body.appendChild(div);
            return div;
        })();
        
        const notification = document.createElement('div');
        notification.className = `flash-message ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="flash-close">&times;</button>
        `;
        container.appendChild(notification);
        
        notification.querySelector('.flash-close').addEventListener('click', () => {
            notification.remove();
        });
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(50px)';
            notification.style.transition = 'all 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    };

    // Bind Add to Cart buttons on menu cards
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const name = btn.dataset.name;
            const price = parseFloat(btn.dataset.price);
            addToCart(id, name, price);
        });
    });

    // ----------------- CART CHECKOUT SUBMISSION -----------------
    const checkoutForm = document.getElementById('mini-checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (cart.length === 0) {
                showNotification('Your cart is empty.', 'error');
                return;
            }
            
            const customerName = document.getElementById('cust-name').value.strip;
            const customerPhone = document.getElementById('cust-phone').value.strip;
            
            const payload = {
                customer_name: document.getElementById('cust-name').value,
                customer_phone: document.getElementById('cust-phone').value,
                cart: cart
            };
            
            try {
                const response = await fetch('/api/orders/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Clear cart
                    cart = [];
                    saveCart();
                    // Redirect to checkout QR page
                    window.location.href = `/checkout?order_id=${result.order_id}`;
                } else {
                    showNotification(result.message || 'Failed to place order.', 'error');
                    if (response.status === 401) {
                        // Redirect to login after a short delay
                        setTimeout(() => window.location.href = '/login', 1500);
                    }
                }
            } catch (error) {
                console.error('Checkout error:', error);
                showNotification('Connection error. Please try again.', 'error');
            }
        });
    }


    // ----------------- PRINT RECEIPT -----------------
    const printBillBtn = document.getElementById('print-bill-btn');
    if (printBillBtn) {
        printBillBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // ----------------- 3D INTERACTIVE TILT ENGINE -----------------
    // 1. Global Viewport Cursor Parallax (for Hero Section)
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    const heroFloatingItems = document.querySelectorAll('.hero-floating');

    if (hero && heroContent) {
        document.addEventListener('mousemove', (e) => {
            // Calculate mouse position relative to center of screen (normalized from -1 to 1)
            const mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
            const mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);

            // Tilt the main hero content card (subtle rotation up to 10 deg)
            const tiltX = -mouseY * 8;
            const tiltY = mouseX * 8;
            
            // Limit FPS using requestAnimationFrame
            requestAnimationFrame(() => {
                heroContent.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
                
                // Parallax shift for floating elements (different coefficients for depth feeling)
                heroFloatingItems.forEach(item => {
                    let depth = 20;
                    if (item.classList.contains('cup')) depth = 30;
                    if (item.classList.contains('bean-1')) depth = -20;
                    if (item.classList.contains('bean-2')) depth = 40;
                    if (item.classList.contains('leaf-1')) depth = -25;
                    if (item.classList.contains('leaf-2')) depth = 12;

                    const moveX = mouseX * depth;
                    const moveY = mouseY * depth;
                    const rotate = mouseX * (depth / 2);

                    item.style.transform = `translate3d(${moveX}px, ${moveY}px, 60px) rotate(${rotate}deg)`;
                });
            });
        });
    }

    // 2. Card Hover 3D Tilt Effect (Feature Cards, Menu Cards, and Stat Cards)
    const tiltCards = document.querySelectorAll('.feature-card, .menu-card, .stat-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            
            // Mouse coordinate relative to card bounding box
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Normalized offset from card center (-1 to 1)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const normalizedX = (x - centerX) / centerX;
            const normalizedY = (y - centerY) / centerY;
            
            // Calculate tilt rotation (up to 12 degrees)
            const rotateX = -normalizedY * 10;
            const rotateY = normalizedX * 10;
            
            requestAnimationFrame(() => {
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                
                // Tilt card children pop-out effect
                const img = card.querySelector('.menu-img');
                const icon = card.querySelector('.feature-icon');
                const title = card.querySelector('h3, h4');
                const desc = card.querySelector('p, .menu-desc');
                const action = card.querySelector('.menu-price-action');

                if (img) img.style.transform = `translateZ(30px) scale(1.03)`;
                if (icon) icon.style.transform = `translateZ(50px) scale(1.08)`;
                if (title) title.style.transform = `translateZ(40px)`;
                if (desc) desc.style.transform = `translateZ(25px)`;
                if (action) action.style.transform = `translateZ(45px)`;
            });
        });
        
        card.addEventListener('mouseleave', () => {
            requestAnimationFrame(() => {
                // Smoothly snap back to center
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                
                // Reset card children
                const img = card.querySelector('.menu-img');
                const icon = card.querySelector('.feature-icon');
                const title = card.querySelector('h3, h4');
                const desc = card.querySelector('p, .menu-desc');
                const action = card.querySelector('.menu-price-action');

                if (img) img.style.transform = `translateZ(20px) scale(1)`;
                if (icon) icon.style.transform = `translateZ(40px) scale(1)`;
                if (title) title.style.transform = `translateZ(30px)`;
                if (desc) desc.style.transform = `translateZ(20px)`;
                if (action) action.style.transform = `translateZ(40px)`;
            });
        });
    });

    // 3. Custom Follower Cursor Logic
    const follower = document.querySelector('.custom-cursor-follower');
    if (follower) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let followerX = mouseX;
        let followerY = mouseY;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            follower.style.opacity = '1';
        });
        
        document.addEventListener('mouseleave', () => {
            follower.style.opacity = '0';
        });
        
        // Smooth cursor lag animation using linear interpolation (lerp)
        const updateFollower = () => {
            const lerpFactor = 0.15;
            followerX += (mouseX - followerX) * lerpFactor;
            followerY += (mouseY - followerY) * lerpFactor;
            
            follower.style.left = `${followerX}px`;
            follower.style.top = `${followerY}px`;
            
            requestAnimationFrame(updateFollower);
        };
        updateFollower();
        
        // Custom cursor hovering expansions
        const hoverElements = document.querySelectorAll('a, button, .feature-card, .menu-card, .add-to-cart-btn, .logo, input, select, textarea');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => follower.classList.add('hovering'));
            el.addEventListener('mouseleave', () => follower.classList.remove('hovering'));
        });
    }

    // 4. 3D Scroll Reveal using IntersectionObserver
    const animateStats = () => {
        const counters = document.querySelectorAll('.stat-num');
        counters.forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-val'));
            const duration = 2000; // 2 seconds
            let startTime = null;
            
            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                
                // Smooth easeOutQuad easing
                const easeOutQuad = (x) => x * (2 - x);
                const currentVal = easeOutQuad(progress) * target;
                
                if (target % 1 === 0) {
                    counter.textContent = Math.floor(currentVal);
                } else {
                    counter.textContent = currentVal.toFixed(1);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    counter.textContent = target; // Ensure exact final value
                }
            };
            
            requestAnimationFrame(step);
        });
    };

    const revealElements = document.querySelectorAll('.scroll-reveal-3d');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    if (entry.target.classList.contains('stats-section')) {
                        animateStats();
                    }
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            threshold: 0.1,
            rootMargin: '0px 0px -60px 0px'
        });
        
        revealElements.forEach(el => revealObserver.observe(el));
    }

    // ----------------- Global Body Parallax Shift -----------------
    document.addEventListener('mousemove', (e) => {
        const mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        const mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
        
        // Shift background position slightly in the opposite direction
        const moveX = -mouseX * 12;
        const moveY = -mouseY * 12;
        
        requestAnimationFrame(() => {
            document.body.style.backgroundPosition = `${moveX}px ${moveY}px`;
        });
    });

    // ----------------- Canvas Particle System -----------------
    class ParticleSystem {
        constructor(canvasId, particleColor = 'rgba(212, 175, 55, 0.3)', particleCount = 40) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.color = particleColor;
            this.particleCount = particleCount;
            this.particles = [];
            this.mouse = { x: null, y: null, radius: 120 };

            this.init();
            this.animate();
            
            window.addEventListener('resize', () => this.resize());
            
            const parent = this.canvas.parentElement;
            parent.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = e.clientX - rect.left;
                this.mouse.y = e.clientY - rect.top;
            });
            
            parent.addEventListener('mouseleave', () => {
                this.mouse.x = null;
                this.mouse.y = null;
            });
        }

        init() {
            this.resize();
            this.particles = [];
            for (let i = 0; i < this.particleCount; i++) {
                this.particles.push(this.createParticle(true));
            }
        }

        resize() {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }

        createParticle(randomY = false) {
            return {
                x: Math.random() * this.canvas.width,
                y: randomY ? Math.random() * this.canvas.height : this.canvas.height + Math.random() * 20,
                size: Math.random() * 2.5 + 0.8,
                speedX: Math.random() * 0.8 - 0.4,
                speedY: -(Math.random() * 0.8 + 0.4),
                density: Math.random() * 15 + 5,
                alpha: Math.random() * 0.6 + 0.1
            };
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.particles.forEach((p, idx) => {
                // Update position
                p.y += p.speedY;
                p.x += p.speedX;

                // Reset if out of bounds (top or sides)
                if (p.y < -10 || p.x < -10 || p.x > this.canvas.width + 10) {
                    this.particles[idx] = this.createParticle(false);
                }

                // Mouse interaction (repulsion)
                if (this.mouse.x !== null && this.mouse.y !== null) {
                    const dx = this.mouse.x - p.x;
                    const dy = this.mouse.y - p.y;
                    const distance = Math.hypot(dx, dy);
                    
                    if (distance < this.mouse.radius) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (this.mouse.radius - distance) / this.mouse.radius;
                        const directionX = forceDirectionX * force * p.density * 0.4;
                        const directionY = forceDirectionY * force * p.density * 0.4;
                        
                        p.x -= directionX;
                        p.y -= directionY;
                    }
                }

                // Draw particle
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                
                // Construct color with particle's alpha
                const colorStr = this.color.replace(/[^,]+(?=\))/, p.alpha.toFixed(2));
                this.ctx.fillStyle = colorStr;
                this.ctx.fill();
            });
            
            requestAnimationFrame(() => this.animate());
        }
    }

    // Instantiate Particle Systems
    new ParticleSystem('hero-particles', 'rgba(212, 175, 55, 0.3)', 45);
    new ParticleSystem('stats-particles', 'rgba(212, 175, 55, 0.25)', 35);

    // Initialize Menu page cart on load
    updateCartBadge();
    renderCart();
});
