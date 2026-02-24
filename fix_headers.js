import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viewsDir = path.join(__dirname, 'src/views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.vue'));

let count = 0;
files.forEach(file => {
    if (['Home.vue', 'Checkout.vue', 'Login.vue', 'Cart.vue', 'Orders.vue', 'Profile.vue', 'PaymentMethods.vue', 'ChangePassword.vue', 'Support.vue', 'Notifications.vue', 'Tracking.vue'].includes(file)) {
        return;
    }

    let content = fs.readFileSync(path.join(viewsDir, file), 'utf8');

    const regex = /<button @click="goBackHome"([\s\S]*?)class="flex items-center gap-2 cursor-pointer([\s\S]*?)>([\s\S]*?)<span class="font-bold(.*?)>([^<]+)<\/span>\s*<\/button>/g;

    const newContent = content.replace(regex, (match, p1, p2, innerHtml, spanClasses, brandName) => {
        return `<div class="flex items-center gap-4">
                <button @click="goBackHome" aria-label="Volver al inicio" class="text-current hover:bg-white/20 w-10 h-10 flex items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-white/50">
                    <i class="fa-solid fa-arrow-left text-xl"></i>
                </button>
                <div class="flex items-center gap-2">
                    ${innerHtml.trim()}
                    <span class="font-bold${spanClasses}>${brandName}</span>
                </div>
            </div>`;
    });

    // Also handle Starbucks separately since it's an <a> tag
    // Starbucks:
    // <a @click.prevent="goBackHome" class="flex items-center space-x-2 md:space-x-3 group cursor-pointer">
    //     <img src="..." alt="Starbucks Logo" class="h-10 w-10 md:h-12 md:w-12 transition-transform duration-300 group-hover:rotate-12">
    //     <span class="font-bold text-xl md:text-2xl tracking-tighter hidden sm:block">Starbucks</span>
    // </a>
    let finalContent = newContent;
    if (file === 'Starbucks.vue') {
        const regexSb = /<a @click\.prevent="goBackHome" class="flex items-center space-x-2 md:space-x-3 group cursor-pointer">\s*<img src="([^"]+)" alt="([^"]+)" class="([^"]+)">\s*<span class="([^"]+)">([^<]+)<\/span>\s*<\/a>/g;
        finalContent = finalContent.replace(regexSb, (match, src, alt, imgClass, spanClass, text) => {
            return `<div class="flex items-center gap-4">
                <button @click="goBackHome" aria-label="Volver al inicio" class="text-white hover:bg-white/20 w-10 h-10 flex items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-white/50">
                    <i class="fa-solid fa-arrow-left text-xl"></i>
                </button>
                <div class="flex items-center space-x-2 md:space-x-3 cursor-default">
                    <img src="${src}" alt="${alt}" class="${imgClass}">
                    <span class="${spanClass}">${text}</span>
                </div>
            </div>`;
        });
    }

    if (content !== finalContent) {
        fs.writeFileSync(path.join(viewsDir, file), finalContent);
        console.log(`Updated ${file}`);
        count++;
    } else {
        console.log(`No match in ${file}`);
    }
});
console.log(`Total files updated: ${count}`);
