export function initSlider() {
    if (typeof Swiper === 'function') {
        const swiper = new Swiper('.swiper-container', {
            // Options de base
            direction: 'horizontal',
            loop: true,
            // autoplay: {
            //     delay: 5000,
            //     disableOnInteraction: false,
            // },
            
            // Important : paramètres pour n'afficher qu'un seul slide
            slidesPerView: 1,
            spaceBetween: 0,
            
            // Empêcher l'effet de débordement
            width: null,  // Laisser Swiper calculer automatiquement
            
            // Configuration optimisée pour mobile
            touchEventsTarget: 'container',
            touchRatio: 1,
            touchAngle: 45,
            simulateTouch: true,
            shortSwipes: true,
            grabCursor: true,
            
            // Pagination
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            
            // Effets
            effect: 'slide',
            speed: 400,
        });
        
        return swiper;
    } else {
        console.error("La bibliothèque Swiper n'est pas chargée.");
        return null;
    }
}