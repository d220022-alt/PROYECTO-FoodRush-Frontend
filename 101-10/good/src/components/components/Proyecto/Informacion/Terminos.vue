<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Términos y Condiciones | FoodRush</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.0/flowbite.min.css" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com"></script>
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#BD0A0A',
                        secondary: '#f1faee',
                        dark: '#1d3557',
                        accent: '#ffb703',
                        light: '#f8f9fa'
                    },
                    fontFamily: {
                        sans: ['Poppins', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    
    <style>
        html { scroll-behavior: smooth; }
        
        /* CORRECCIÓN CLAVE: Margen de desplazamiento para que el navbar no tape el título */
        .section-target {
            scroll-margin-top: 140px; /* Esto asegura que el título se vea debajo del menú */
        }

        /* Barra lateral pegajosa para navegación */
        .sticky-sidebar {
            position: -webkit-sticky;
            position: sticky;
            top: 100px;
            max-height: 80vh;
            overflow-y: auto;
        }
        /* Scrollbar fina para el menú lateral */
        .sticky-sidebar::-webkit-scrollbar { width: 4px; }
        .sticky-sidebar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

        .term-link.active {
            color: #BD0A0A;
            border-left: 3px solid #BD0A0A;
            padding-left: 12px;
            font-weight: 700;
            background: rgba(189, 10, 10, 0.05);
        }
        .term-link {
            border-left: 3px solid transparent;
            padding-left: 12px;
            transition: all 0.3s ease;
            display: block;
            padding-top: 5px;
            padding-bottom: 5px;
        }
        .term-link:hover {
            color: #BD0A0A;
            padding-left: 15px;
        }
    </style>
</head>
<body class="font-sans antialiased bg-gray-50 text-gray-800 flex flex-col min-h-screen">

    <nav class="bg-white/90 backdrop-blur-md shadow-sm py-4 sticky top-0 z-50 transition-all h-[80px]">
        <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4">
            <a href="principal.html" class="flex items-center space-x-2 group">
                <i class="fas fa-bolt text-3xl text-primary animate-pulse group-hover:scale-110 transition-transform"></i>
                <span class="self-center text-2xl font-extrabold tracking-tight text-gray-900">FOODRUSH</span>
            </a>
            
            <button data-collapse-toggle="navbar-terms" type="button" class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none">
                <i class="fas fa-bars text-xl"></i>
            </button>

            <div class="hidden w-full md:block md:w-auto" id="navbar-terms">
                <ul class="flex flex-col font-medium p-4 md:p-0 mt-4 md:flex-row md:space-x-8 md:mt-0 items-center">
                    <li><a href="principal.html" class="block py-2 px-3 text-gray-700 hover:text-primary transition-colors font-semibold">Inicio</a></li>
                    <li><a href="nosotros.html" class="block py-2 px-3 text-gray-700 hover:text-primary transition-colors font-semibold">Nosotros</a></li>
                    <li><a href="soporte.html" class="block py-2 px-3 text-gray-700 hover:text-primary transition-colors font-semibold">Soporte</a></li>
                    <li><a href="principal.html" class="block py-2 px-3 md:p-0 ms-4"><span class="bg-gray-900 text-white px-5 py-2 rounded-full hover:bg-primary transition-all shadow-md text-sm font-semibold">Volver al Home</span></a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="bg-gradient-to-r from-primary to-red-800 text-white py-20 text-center relative overflow-hidden">
        <i class="fas fa-balance-scale absolute top-10 left-10 text-9xl opacity-10 rotate-12"></i>
        <div class="container mx-auto px-4 relative z-10" data-aos="fade-up">
            <h1 class="text-4xl md:text-5xl font-extrabold mb-4">Términos y Condiciones</h1>
            <p class="text-white/80 text-lg max-w-2xl mx-auto">Marco legal y políticas de uso de la plataforma FoodRush.</p>
            <p class="text-xs mt-4 text-white/60">Actualizado: Febrero 2026</p>
        </div>
    </div>

    <div class="container mx-auto px-4 py-16">
        <div class="flex flex-col lg:flex-row gap-12">
            
            <div class="w-full lg:w-1/4 hidden lg:block">
                <div class="sticky-sidebar bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h3 class="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider border-b pb-2">Tabla de Contenido</h3>
                    <ul class="space-y-1 text-sm text-gray-600">
                        <li><a href="#intro" class="term-link active">1. Introducción</a></li>
                        <li><a href="#uso" class="term-link">2. Uso de la Plataforma</a></li>
                        <li><a href="#cuentas" class="term-link">3. Registro y Seguridad</a></li>
                        <li><a href="#pedidos" class="term-link">4. Pedidos y Pagos</a></li>
                        <li><a href="#cancelaciones" class="term-link">5. Política de Reembolso</a></li>
                        <li><a href="#propiedad" class="term-link">6. Propiedad Intelectual</a></li>
                        <li><a href="#datos" class="term-link">7. Protección de Datos</a></li>
                        <li><a href="#leyes" class="term-link">8. Legislación Aplicable</a></li>
                        <li><a href="#responsabilidad" class="term-link">9. Limitación de Responsabilidad</a></li>
                        <li><a href="#conducta" class="term-link">10. Conducta del Usuario</a></li>
                        <li><a href="#modificaciones" class="term-link">11. Modificaciones</a></li>
                        <li><a href="#contacto" class="term-link">12. Contacto Legal</a></li>
                    </ul>
                </div>
            </div>

            <div class="w-full lg:w-3/4">
                <div class="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 space-y-16">
                    
                    <div id="intro" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">1</span>
                            Introducción
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            Bienvenido a <strong>FoodRush</strong>. Estos términos y condiciones constituyen un acuerdo legalmente vinculante entre usted (el "Usuario") y FoodRush Inc. Al descargar, acceder o utilizar nuestra aplicación móvil o sitio web, usted acepta cumplir con estos términos. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio.
                        </p>
                    </div>

                    <div id="uso" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">2</span>
                            Uso de la Plataforma Multi-Tenant
                        </h2>
                        <p class="text-gray-600 leading-relaxed mb-4">
                            FoodRush opera bajo un modelo de arquitectura de software <strong>Multi-Tenant (Multi-inquilino)</strong>. Esto implica que:
                        </p>
                        <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                            <li>Actuamos como intermediarios tecnológicos entre usted y las franquicias afiliadas (KFC, McDonald's, Burger King, etc.).</li>
                            <li>Cada franquicia ("Inquilino") es responsable de la gestión de su inventario, precios y preparación de alimentos.</li>
                            <li>FoodRush facilita la plataforma tecnológica y, en algunos casos, la logística de entrega de última milla.</li>
                        </ul>
                    </div>

                    <div id="cuentas" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">3</span>
                            Registro y Seguridad de la Cuenta
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            Para utilizar el servicio, debe ser mayor de 13 años. Usted es responsable de salvaguardar la contraseña que utiliza para acceder al servicio y de cualquier actividad o acción bajo su contraseña. FoodRush se reserva el derecho de suspender cuentas que presenten actividad sospechosa, fraudulenta o que violen nuestras normas comunitarias.
                        </p>
                    </div>

                    <div id="pedidos" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">4</span>
                            Pedidos y Pagos
                        </h2>
                        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r">
                            <p class="text-sm text-blue-700"><strong>Nota Fiscal:</strong> Todos los precios mostrados incluyen el ITBIS (Impuesto sobre Transferencia de Bienes Industrializados y Servicios) conforme a las leyes tributarias de la República Dominicana.</p>
                        </div>
                        <p class="text-gray-600 leading-relaxed">
                            Los precios de los productos y los gastos de envío están sujetos a cambios en cualquier momento. El contrato de venta se formaliza cuando la franquicia confirma su pedido. FoodRush procesa los pagos a través de pasarelas seguras (Azul, PayPal, Stripe).
                        </p>
                    </div>

                    <div id="cancelaciones" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">5</span>
                            Política de Reembolso y Cancelación
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            El usuario puede cancelar un pedido sin penalización si el estado es "Pendiente". Una vez el estado cambia a "En Preparación", no se aceptan cancelaciones. Los reembolsos por pedidos incorrectos o en mal estado se procesarán tras una investigación, acreditándose a la forma de pago original en un plazo de 3-5 días hábiles.
                        </p>
                    </div>

                    <div id="propiedad" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">6</span>
                            Propiedad Intelectual
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            El servicio y su contenido original (excluyendo el contenido proporcionado por las franquicias), características y funcionalidad son y seguirán siendo propiedad exclusiva de FoodRush Inc. y sus licenciantes. El nombre "FoodRush" y el logotipo están protegidos por derechos de autor y marcas registradas.
                        </p>
                    </div>

                    <div id="datos" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">7</span>
                            Protección de Datos (Ley 172-13)
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            En cumplimiento con la <strong>Ley No. 172-13</strong> sobre Protección de Datos de Carácter Personal de la República Dominicana, FoodRush garantiza que sus datos personales serán tratados con estricta confidencialidad y solo para los fines de la prestación del servicio. No vendemos sus datos a terceros.
                        </p>
                    </div>

                    <div id="leyes" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">8</span>
                            Legislación Aplicable y Jurisdicción
                        </h2>
                        <p class="text-gray-600 leading-relaxed mb-4">
                            Estos Términos se regirán e interpretarán de acuerdo con las leyes de la <strong>República Dominicana</strong>, sin tener en cuenta sus disposiciones sobre conflictos de leyes.
                        </p>
                        <p class="text-gray-600 leading-relaxed">
                            Cualquier disputa relacionada con estos términos será sometida a la jurisdicción exclusiva de los tribunales de <strong>Santiago de los Caballeros</strong>. Asimismo, reconocemos la autoridad del Instituto Nacional de Protección de los Derechos del Consumidor (Pro-Consumidor) bajo la <strong>Ley 358-05</strong>.
                        </p>
                    </div>

                    <div id="responsabilidad" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">9</span>
                            Limitación de Responsabilidad
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            En ningún caso FoodRush, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán responsables de daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo, sin limitación, pérdida de beneficios, datos, uso, buena voluntad, u otras pérdidas intangibles, resultantes de su acceso o uso del servicio.
                        </p>
                    </div>

                    <div id="conducta" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">10</span>
                            Conducta del Usuario
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            El usuario se compromete a no utilizar la plataforma para:
                        </p>
                        <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                            <li>Realizar pedidos falsos o fraudulentos.</li>
                            <li>Introducir virus, troyanos u otro material malicioso.</li>
                            <li>Acosar o intimidar a los repartidores o personal de soporte.</li>
                            <li>Intentar acceder sin autorización a los sistemas de FoodRush.</li>
                        </ul>
                    </div>

                    <div id="modificaciones" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">11</span>
                            Modificaciones a los Términos
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días antes de que entren en vigor los nuevos términos.
                        </p>
                    </div>

                    <div id="contacto" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">12</span>
                            Contacto Legal
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            Si tiene alguna pregunta sobre estos Términos, o desea ejercer sus derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), por favor contáctenos:
                        </p>
                        <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p><strong>Email Legal:</strong> legal@foodrush.com</p>
                            <p><strong>Dirección:</strong> Av. 27 de Febrero, Santiago, República Dominicana.</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>

    <footer class="bg-[#BD0A0A] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                 <div class="flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg">
                    <span class="text-orange-500 font-bold text-xl italic">Food</span>
                    <span class="text-slate-800 font-bold text-xl italic -ml-1">Rush</span>
                </div>
                <p class="text-white/90 text-sm mb-6 font-medium max-w-xs">La mejor comida de tus franquicias favoritas directo a tu puerta.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition"><i class="fa-brands fa-twitter"></i></a>
                </div>
            </div>
            <div class="flex gap-16 text-sm text-left md:text-right">
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/20 pb-2">Ayuda</h4>
                    <ul class="space-y-3 text-white/90 font-medium">
                        <li><a href="nosotros.html#faq" class="hover:text-white hover:underline">Preguntas Frecuentes</a></li>
                        <li><a href="soporte.html" class="hover:text-white hover:underline">Soporte</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Términos</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/20 pb-2">Empresa</h4>
                    <ul class="space-y-3 text-white/90 font-medium">
                        <li><a href="nosotros.html" class="hover:text-white hover:underline">Sobre Nosotros</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Blog</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Afíliate</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="border-t border-white/20 text-center py-4 text-xs text-white/60">
            &copy; 2025 FoodRush Inc. Todos los derechos reservados.
        </div>
    </footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.0/flowbite.min.js"></script>
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script>
        AOS.init({ duration: 800, once: true });

        // Script para resaltar la sección activa en el menú lateral
        window.addEventListener('scroll', function() {
            let current = '';
            const sections = document.querySelectorAll('.section-target');
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                // Ajuste de scrollSpy (punto de activación)
                if (pageYOffset >= sectionTop - 200) {
                    current = section.getAttribute('id');
                }
            });

            document.querySelectorAll('.term-link').forEach(li => {
                li.classList.remove('active');
                if (li.getAttribute('href').includes(current)) {
                    li.classList.add('active');
                }
            });
        });
    </script>
</body>
</html>