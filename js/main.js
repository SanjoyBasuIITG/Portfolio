// Wait for DOM to load
document.addEventListener("DOMContentLoaded", (event) => {
    // Register GSAP plugins if needed (ScrollTrigger usually)
    gsap.registerPlugin(ScrollTrigger);

    // Initial load animation for Hero section
    const tl = gsap.timeline();
    
    tl.from(".nav-brand, .nav-links a", {
        y: -20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out"
    })
    .from(".hero .eyebrow", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out"
    }, "-=0.4")
    .from(".hero h1", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.4")
    .from(".hero p", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out"
    }, "-=0.4")
    .from(".hero .btn", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out"
    }, "-=0.4");

    // Scroll animations for sections
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: "top 80%",
                toggleActions: "play none none reverse"
            },
            x: -50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        });
    });

    gsap.utils.toArray('.glass-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            delay: i * 0.1,
            ease: "power3.out"
        });
    });

    // Gallery item stagger animation
    if(document.querySelector('.gallery-grid')) {
        gsap.from(".gallery-item", {
            scrollTrigger: {
                trigger: ".gallery-grid",
                start: "top 80%"
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
        });
    }
});
