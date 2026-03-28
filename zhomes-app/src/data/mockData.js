// Datos reales del equipo ZHOMES Real Estate — Louisville, KY
// Fundado en 2014 por Gilbert Zaldivar | 7520 Preston Hwy, Louisville, KY 40219

export const COMPANY = {
    name: 'ZHomes Real Estate',
    address: '7520 Preston Hwy, Louisville, KY 40219',
    phone: '(502) 641-6623',
    email: 'gilbert@zhomesre.com',
    website: 'https://zhomesre.com',
    founded: 2014,
    broker: 'Gilbert R Zaldivar',
}

export const BROKER = {
    id: 0,
    name: 'Gilbert R Zaldivar',
    photo: '/assets/agents/Gilbert Zaldivar-Broker.png',
    title: 'Principal Broker · Fundador',
    phone: '(502) 641-6623',
    email: 'micasa.gilbert@gmail.com',
    languages: ['🇺🇸 EN', '🇲🇽 ES', '🇮🇹 IT'],
    experience: '9 años',
}

// Agentes con foto disponible (datos del Excel real)
export const REALTORS = [
    {
        id: 1,
        name: 'Jessica Hernandez',
        photo: '/assets/agents/Jessica Hernandez/Jessica Hernandez.png',
        profilePhoto: '/assets/agents/Jessica Hernandez/perfil.png',
        video: '/assets/agents/Jessica Hernandez/Jessica video mov.webm',
        title: 'Asesora Residencial',
        specialty: 'Primera Vivienda & Familias',
        bio: 'Jessica combina su pasión por el servicio con un conocimiento sólido del mercado residencial de Louisville. Su enfoque cercano y bilingüe la convierte en una aliada ideal para familias hispanas buscando su primer hogar.',
        rating: 4.9,
        sales: 28,
        experience: '1 año',
        languages: ['🇺🇸 EN', '🇲🇽 ES'],
        topProducer: false,
        phone: '(502) 381-3781',
        email: 'valcarceljessy@gmail.com',
        social: { instagram: 'https://instagram.com/jessica.zhomes', facebook: 'https://facebook.com/jessica.zhomes' },
    },
    {
        id: 2,
        name: 'Judith Gonzalez',
        photo: '/assets/agents/Judith Gonzalez/Imagen de WhatsApp 2025-11-08 a las 12.55.35_4541512b-Photoroom.png',
        profilePhoto: '/assets/agents/Judith Gonzalez/perfil.png',
        title: 'Asesora Residencial',
        specialty: 'Reubicación & Nuevos Residentes',
        bio: 'Judith está comenzando su carrera en real estate con energía y dedicación. Su calidez y compromiso con cada cliente la hacen destacar desde el primer día.',
        rating: 4.8,
        sales: 12,
        experience: 'Nuevo talento',
        languages: ['🇺🇸 EN', '🇲🇽 ES'],
        topProducer: false,
        phone: '(502) 767-5658',
        email: 'judithgonzalezrealestate@gmail.com',
        social: { instagram: 'https://instagram.com/judith.zhomes', facebook: 'https://facebook.com/judith.zhomes' },
    },
    {
        id: 3,
        name: 'Miriam C Castaño',
        photo: '/assets/agents/Miriam Castano/Miriam Castano.png',
        profilePhoto: '/assets/agents/Miriam Castano/perfil.png',
        title: 'Top Producer · Asesora Senior',
        specialty: 'Propiedades de Lujo & Inversión',
        bio: 'Con 6 años de experiencia, Miriam es una de las agentes más experimentadas del equipo. Su conocimiento profundo del mercado de Louisville y habilidades de negociación la convierten en la opción ideal para transacciones de alto valor.',
        rating: 5.0,
        sales: 94,
        experience: '6 años',
        languages: ['🇺🇸 EN', '🇲🇽 ES'],
        topProducer: true,
        phone: '(502) 821-9977',
        email: 'realtormiriamcastano@gmail.com',
        social: { instagram: 'https://instagram.com/miriam.zhomes', facebook: 'https://facebook.com/miriam.zhomes' },
    },
    {
        id: 4,
        name: 'Yusleidy Perez',
        photo: '/assets/agents/Yusleidy Perez/H40A6121-Photoroom.png',
        profilePhoto: '/assets/agents/Yusleidy Perez/perfil.png',
        title: 'Relocation Specialist',
        specialty: 'Reubicación & Nuevos Residentes',
        bio: 'Especialista en familias que se mudan a Kentucky desde otros estados y países. Yusleidy ofrece un servicio integral que incluye orientación sobre escuelas, comunidades y todo lo necesario para comenzar una nueva vida.',
        rating: 4.9,
        sales: 41,
        experience: '0 años',
        languages: ['🇺🇸 EN', '🇲🇽 ES'],
        topProducer: false,
        phone: '(502) 310-2204',
        email: 'yusleidyrealtor@gmail.com',
        social: { instagram: 'https://instagram.com/yusleidy.zhomes', facebook: 'https://facebook.com/yusleidy.zhomes' },
    },
    { id: 5, name: 'Alan Hernandez', photo: '/assets/agents/Alan Hernandez/Imagen de WhatsApp 2025-08-09 a las 22.48.44_d20393ff-Photoroom.png', profilePhoto: '/assets/agents/Alan Hernandez/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Agente comprometido con el servicio al cliente.', rating: 4.5, sales: 5, experience: '2 años', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(502) 296-1588', email: 'alan-6920@hotmail.com', social: {} },
    { id: 6, name: 'Celia Hernandez', photo: '/assets/agents/Celia Hernandez/Imagen de WhatsApp 2025-08-09 a las 22.48.44_9b9c15e4-Photoroom.png', profilePhoto: '/assets/agents/Celia Hernandez/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Dedicada a encontrar el hogar perfecto.', rating: 4.5, sales: 0, experience: 'Nuevo talento', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(502) 365-0718', email: 'celiadhernandez17@gmail.com', social: {} },
    { id: 7, name: 'Dario Hernandez', photo: '/assets/agents/Dario Hernandez/H40A6413-Photoroom.png', profilePhoto: '/assets/agents/Dario Hernandez/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Asesoría de calidad para cada cliente.', rating: 4.7, sales: 15, experience: '3 años', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(502) 389-1023', email: 'betterhomesdario@gmail.com', social: {} },
    { id: 8, name: 'Ernesto Cougil', photo: '/assets/agents/Ernesto Cougil/H40A6422-Photoroom.png', profilePhoto: '/assets/agents/Ernesto Cougil/perfil.png', title: 'Broker Associate', specialty: 'Residential', bio: 'Experiencia y profesionalismo en cada etapa.', rating: 4.9, sales: 30, experience: '4 años', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(502) 526-2896', email: 'ernestotoprealtor@gmail.com', social: {} },
    { id: 9, name: 'Gilbert Zaldivar', photo: '/assets/agents/Gilbert Zaldivar/Gilbert Zaldivar HQ.png', profilePhoto: '/assets/agents/Gilbert Zaldivar/perfil.png', title: 'Principal Broker', specialty: 'Luxury & Investment', bio: 'Líder del equipo ZHOMES, enfocado en el éxito.', rating: 5.0, sales: 150, experience: '9 años', languages: ['🇺🇸 EN', '🇲🇽 ES', '🇮🇹 IT'], topProducer: true, phone: '(502) 641-6623', email: 'micasa.gilbert@gmail.com', social: {} },
    { id: 10, name: 'Leidys Herrera', photo: '/assets/agents/Leidys Herrera/_DSC0060-Photoroom.png', profilePhoto: '/assets/agents/Leidys Herrera/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Acompañando a las familias a cumplir sus sueños.', rating: 4.8, sales: 25, experience: '5 años', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(502) 356-7264', email: 'lhtopagent@gmail.com', social: {} },
    { id: 11, name: 'Lisbeisy Echeverria', photo: '/assets/agents/Lisbeisy Echeverria/H40A6181-Photoroom.png', profilePhoto: '/assets/agents/Lisbeisy Echeverria/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Asesora enfocada en resultados positivos.', rating: 4.5, sales: 0, experience: 'Nuevo talento', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(502) 435-2496', email: 'lisbeisyrealestate@gmail.com', social: {} },
    { id: 12, name: 'Maria Mendez', photo: '/assets/agents/Maria Mendez/H40A6104-Photoroom.png', profilePhoto: '/assets/agents/Maria Mendez/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Dedicación y esfuerzo al servicio de mis clientes.', rating: 4.8, sales: 20, experience: '4 años', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(305) 923-7367', email: 'mtm60bayona@gmail.com', social: {} },
    { id: 13, name: 'Mariam Rodriguez', photo: '/assets/agents/Mariam Rodriguez/H40A6148-Photoroom.png', profilePhoto: '/assets/agents/Mariam Rodriguez/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Con pasión por el real estate.', rating: 4.5, sales: 0, experience: 'Nuevo talento', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(502) 915-6437', email: 'mariamrealtor24@gmail.com', social: {} },
    { id: 14, name: 'Maylin Rodriguez', photo: '/assets/agents/Maylin Rodriguez/Imagen de WhatsApp 2025-03-28 a las 00.25.51_e36cac97-Photoroom.png', profilePhoto: '/assets/agents/Maylin Rodriguez/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Tu hogar ideal es mi prioridad.', rating: 4.5, sales: 0, experience: 'Nuevo talento', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(502) 202-1597', email: 'maylinkyrealtor@gmail.com', social: {} },

    { id: 16, name: 'Rocio Martinez', photo: '/assets/agents/Rocio Martinez/H40A6352-Photoroom.png', profilePhoto: '/assets/agents/Rocio Martinez/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Asesorando a la comunidad un hogar a la vez.', rating: 4.5, sales: 0, experience: 'Nuevo talento', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(786) 383-9236', email: 'rociomartinez.realtor@gmail.com', social: {} },
    { id: 17, name: 'Ronney Aguiar', photo: '/assets/agents/Ronney Aguiar/Imagen de WhatsApp 2025-08-09 a las 22.48.44_06ed62ca-Photoroom.png', profilePhoto: '/assets/agents/Ronney Aguiar/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Energía y compromiso con mis clientes.', rating: 4.5, sales: 0, experience: 'Nuevo talento', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(502) 915-1568', email: 'ronneyaguiar96@gmail.com', social: {} },
    { id: 18, name: 'Sidalg Nieves', photo: '/assets/agents/Sidalg Nieves/Imagen de WhatsApp 2025-08-09 a las 22.48.44_d02bf26b-Photoroom.png', profilePhoto: '/assets/agents/Sidalg Nieves/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Preparado para ayudarte a realizar tu inversión.', rating: 4.5, sales: 0, experience: 'Nuevo talento', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(502) 794-9894', email: 'sidalgnievesrealtor@gmail.com', social: {} },
    { id: 19, name: 'Yeimy Ortiz', photo: '/assets/agents/Yeimy Ortiz/H40A6214-Photoroom.png', profilePhoto: '/assets/agents/Yeimy Ortiz/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Buscando siempre las mejores opciones del mercado.', rating: 4.5, sales: 0, experience: 'Nuevo talento', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(502) 640-4036', email: 'yeimykyrealtor@gmail.com', social: {} },
    { id: 20, name: 'Yurisbel Garcia', photo: '/assets/agents/Yurisbel Garcia/H40A6136-Photoroom.png', profilePhoto: '/assets/agents/Yurisbel Garcia/perfil.png', title: 'Agent', specialty: 'Residential', bio: 'Profesionalismo a tu alcance.', rating: 4.5, sales: 0, experience: 'Nuevo talento', languages: ['🇺🇸 EN', '🇲🇽 ES'], topProducer: false, phone: '(502) 592-1390', email: 'yurrealestate@gmail.com', social: {} },
]

// Todos los agentes del brokeraje (para TeamPage del broker)
export const ALL_AGENTS = [
    { name: 'Gilbert R Zaldivar', role: 'Principal Broker', phone: '(502) 641-6623', email: 'micasa.gilbert@gmail.com', languages: 'English, Spanish, Italian', experience: 9, photo: '/assets/agents/Gilbert Zaldivar-Broker.png', hasPhoto: true },
    { name: 'Ernesto Cougil', role: 'Broker Associate', phone: '(502) 526-2896', email: 'ernestotoprealtor@gmail.com', languages: 'English, Spanish', experience: 4, photo: null, hasPhoto: true },
    { name: 'Miriam C Castaño', role: 'Top Producer', phone: '(502) 821-9977', email: 'realtormiriamcastano@gmail.com', languages: 'English, Spanish', experience: 6, photo: '/assets/agents/Miriam Castano.png', hasPhoto: true },

    { name: 'Teresa Verdecia', role: 'Senior Agent', phone: '(502) 314-4344', email: 'teresa.verdecia@hotmail.com', languages: 'English, Spanish', experience: 6, photo: null, hasPhoto: true },
    { name: 'Leidys Herrera', role: 'Agent', phone: '(502) 356-7264', email: 'lhtopagent@gmail.com', languages: 'English, Spanish', experience: 5, photo: null, hasPhoto: true },
    { name: 'Maria T Mendez', role: 'Agent', phone: '(305) 923-7367', email: 'mtm60bayona@gmail.com', languages: 'English, Spanish', experience: 4, photo: null, hasPhoto: true },
    { name: 'Dario Hernandez', role: 'Agent', phone: '(502) 389-1023', email: 'betterhomesdario@gmail.com', languages: 'English, Spanish', experience: 3, photo: null, hasPhoto: true },
    { name: 'Yusleidy Perez', role: 'Agent', phone: '(502) 310-2204', email: 'yusleidyrealtor@gmail.com', languages: 'English, Spanish', experience: 3, photo: '/assets/agents/Yusleidy Perez.png', hasPhoto: true },
    { name: 'Alan J Hernandez', role: 'Agent', phone: '(502) 296-1588', email: 'alan-6920@hotmail.com', languages: 'English, Spanish', experience: 2, photo: null, hasPhoto: false },
    { name: 'Jorge Betancourt', role: 'Agent', phone: '(502) 432-9588', email: 'jorgeale90bet@gmail.com', languages: 'English, Spanish', experience: 2, photo: null, hasPhoto: false },
    { name: 'Stanis Shimiyimana', role: 'Agent', phone: '(270) 935-7360', email: 'stanisrealty@gmail.com', languages: 'English, French', experience: 2, photo: null, hasPhoto: false },
    { name: 'Jessica Hernandez', role: 'Agent', phone: '(502) 381-3781', email: 'valcarceljessy@gmail.com', languages: 'English, Spanish', experience: 1, photo: '/assets/agents/Jessica Hernandez.png', hasPhoto: true },
    { name: 'Betsy S Zaldivar', role: 'Agent', phone: '(502) 310-6049', email: 'betsyszaldivar1016@icloud.com', languages: 'English, Spanish', experience: 1, photo: null, hasPhoto: false },
    { name: 'Judith Gonzalez', role: 'Agent', phone: '(502) 767-5658', email: 'judithgonzalezrealestate@gmail.com', languages: 'English, Spanish', experience: 0, photo: '/assets/agents/Judith Gonzalez.png', hasPhoto: true },
    { name: 'Maylin Rodriguez', role: 'Agent', phone: '(502) 202-1597', email: 'maylinkyrealtor@gmail.com', languages: 'English, Spanish', experience: 0, photo: null, hasPhoto: false },
    { name: 'Claudia Preciado', role: 'Agent', phone: '(502) 751-6630', email: 'claudiakyrealtor@gmail.com', languages: '', experience: 0, photo: null, hasPhoto: false },
    { name: 'Rocio Martinez', role: 'Agent', phone: '(786) 383-9236', email: 'rociomartinez.realtor@gmail.com', languages: '', experience: 0, photo: null, hasPhoto: false },
    { name: 'Yeimy Ortiz', role: 'Agent', phone: '(502) 640-4036', email: 'yeimykyrealtor@gmail.com', languages: '', experience: 0, photo: null, hasPhoto: false },
    { name: 'Sidalg Nieves', role: 'Agent', phone: '(502) 794-9894', email: 'sidalgnievesrealtor@gmail.com', languages: '', experience: 0, photo: null, hasPhoto: false },
    { name: 'Mariam Rodriguez', role: 'Agent', phone: '(502) 915-6437', email: 'mariamrealtor24@gmail.com', languages: '', experience: 0, photo: null, hasPhoto: false },
    { name: 'Lisbeisy Echeverria', role: 'Agent', phone: '(502) 435-2496', email: 'lisbeisyrealestate@gmail.com', languages: '', experience: 0, photo: null, hasPhoto: false },
    { name: 'Geraldine Santiago', role: 'Agent', phone: '(502) 321-0671', email: 'geraldine10realtor@gmail.com', languages: '', experience: 0, photo: null, hasPhoto: false },
    { name: 'Roxana Arias', role: 'Agent', phone: '(502) 641-7470', email: 'roxanakyrealestate@gmail.com', languages: '', experience: 0, photo: null, hasPhoto: false },
    { name: 'Ronney Aguiar', role: 'Agent', phone: '(502) 915-1568', email: 'ronneyaguiar96@gmail.com', languages: '', experience: 0, photo: null, hasPhoto: false },
    { name: 'Celia Hernandez', role: 'Agent', phone: '(502) 365-0718', email: '', languages: '', experience: 0, photo: null, hasPhoto: false },
    { name: 'Yurisbel Garcia', role: 'Agent', phone: '(502) 592-1390', email: 'yurrealestate@gmail.com', languages: '', experience: 0, photo: null, hasPhoto: false },
]

// Datos mock de propiedades con coordenadas para el mapa
export const MOCK_PROPERTIES = [
    {
        "id": "20160205214915772559000000",
        "address": "1210 Holly Ave, Louisville, KY 40118",
        "price": 70000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160205220319265413000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160205220319265413000000.jpg"
        ],
        "beds": 2,
        "baths": 1,
        "sqft": 948,
        "type": "casa",
        "description": "*** Short Sale sold as is, subject to lender 3rd Party approval.   Home was originally a 3 bedroom but has been remodeled into a 2 bedroom with large master.   Large lot and 2.5 car garage out back.   Newer HVAC, water heater, sump pump.",
        "lat": 38.10157,
        "lng": -85.743178,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160205220144547402000000",
        "address": "6427 Six Mile Ln, Louisville, KY 40218",
        "price": 151000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160205220751345545000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160205220751345545000000.jpg"
        ],
        "beds": 3,
        "baths": 2,
        "sqft": 1125,
        "type": "casa",
        "description": "Hurry!  Don’t miss out on this Awesome 3 Bedroom, 2 Full Bath Ranch with a basement and garage.  Very cozy living room and dining area with beautiful hardwood floors.  Nice eat-in kitchen with updates in past years.  Three good size bedrooms and a master bedroom with its own private bath.  Second full bath in the hall.  Huge open basement with a family room and a game room area.  Large laundry room.  Big fenced-in back yard with a huge 2-car detached garage.  This home is move-in condition and shows Pride of Ownership!",
        "lat": 38.198256,
        "lng": -85.634072,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160205233015014893000000",
        "address": "1337 Gilmore Ln, Louisville, KY 40213",
        "price": 99995,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160205233528610882000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160205233528610882000000.jpg"
        ],
        "beds": 3,
        "baths": 2,
        "sqft": 1108,
        "type": "casa",
        "description": "Beautiful Remodel!  Just move in!  Nothing you need to do on this one!  Beautiful wood laminate floor n the living room and tile in the large eat-in kitchen.  New cabinets and countertop and the appliances stay.  Three bedrooms with closets.  A fully remodeled bath in the hallway.  The master bedroom is big and has its own private full bath.  Fresh carpet and paint.  Replaced windows, furnace and air.  Huge fenced in back yard.  Better Hurry – A Showing is a Sale!",
        "lat": 38.181744,
        "lng": -85.700973,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160206001355640319000000",
        "address": "4703 Kitty Hawk Way, Louisville, KY 40207",
        "price": 235000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160206031707647819000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160206031707647819000000.jpg"
        ],
        "beds": 5,
        "baths": 3,
        "sqft": 1525,
        "type": "casa",
        "description": "This listing has an accepted offer as of 02/05/2016 contingent upon inspections.The Owner's are sad to let this one go after 50 years in the family. Well maintained brick walk out ranch on a truly stunning park like lot. There is lot's to love about this mid century modern style home with open floor plan and picture window overlooking the back yard. 5 bedrooms, 2.5 baths hardwood floor and two fireplaces and a huge family room with another panoramic view of the yard. Roomy eat in kitchen with tons of cabinets and planning desk.  Updates include roof, windows, gutters and siding. Waiting for you to add your modern touches and take this home into the next 50 years.",
        "lat": 38.270667,
        "lng": -85.643444,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160206020144225237000000",
        "address": "10003 Omar Khayyam Blvd, Louisville, KY 40272",
        "price": 800,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160206022257250104000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160206022257250104000000.jpg"
        ],
        "beds": 3,
        "baths": 1,
        "sqft": 1133,
        "type": "casa",
        "description": "Pets allowed with restrictions and $500 deposit per pet. No Smoking. No Section 8. $35.90 Application Fee. Application is attached.",
        "lat": 38.110298,
        "lng": -85.874761,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20180728135733367075000000",
        "address": "3203 Dale Ann Dr, Louisville, KY 40220",
        "price": 166000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20180731000938781991000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20180731000938781991000000.jpg"
        ],
        "beds": 4,
        "baths": 3,
        "sqft": 1850,
        "type": "casa",
        "description": "Hermosa propiedad recién ingresada.",
        "lat": 38.209532,
        "lng": -85.628909,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20150809191005365689000000",
        "address": "1111 Cherry Hollow Rd, La Grange, KY 40031",
        "price": 212631,
        "image": "https://cdn.photos.sparkplatform.com/lou/20150809192127912789000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20150809192127912789000000.jpg"
        ],
        "beds": 4,
        "baths": 3,
        "sqft": 2181,
        "type": "casa",
        "description": "Welcome to the beautiful Carlisle floor plan. Photos not actual.",
        "lat": 38.39606,
        "lng": -85.371762,
        "exclusive": true,
        "city": "Louisville, KY"
    },
    {
        "id": "20160206034118163790000000",
        "address": "2505 Lower Hunters Trace, Louisville, KY 40216",
        "price": 94900,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160206042230687832000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160206042230687832000000.jpg"
        ],
        "beds": 3,
        "baths": 2,
        "sqft": 1290,
        "type": "casa",
        "description": "Here's your chance to own a ''One of a Kind'' property!  The well known ''UK House'' in PRP could be yours! This 3 Bedroom 1.5 bath bungalow has lots to offer including newer carpet and paint throughout as well as a 1 year old roof. The first floor is home to the living room, kitchen, formal dining, a bedroom and a full bath.  The 2nd floor boasts a half bath, 2 additional bedrooms,a small loft area and lots of storage. The unfinished basement has tons of storage space as well as 2 storm shelters.  The huge lot is over an acre! The back yard is home to many raspberries, blackberries and several types of grapes that return every year!  There is a 2.5 car detached garage as well as 2 additional smaller outbuildings also great for storage or even a playhouse.",
        "lat": 38.163088,
        "lng": -85.857351,
        "exclusive": true,
        "city": "Louisville, KY"
    },
    {
        "id": "20160206140020611111000000",
        "address": "4506 Micklenburg Ct, Louisville, KY 40245",
        "price": 159900,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160206140434192681000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160206140434192681000000.jpg"
        ],
        "beds": 4,
        "baths": 2,
        "sqft": 1068,
        "type": "casa",
        "description": "***This property has an ACCEPTED CONTRACT as of 2/09/2016 pending inspections and release of contingencies*** .  Immaculate, Move-in Ready Updated Home.  Features include Replacement Windows, New Roof, Updated Central Air and Furnace, Updated Electrical , Updated Kitchen, Gorgeous Floors and Open Floor Plan.  Too many improvements to  list.  Stop by and see for yourself.  Enjoy!",
        "lat": 38.310843,
        "lng": -85.526011,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160206162356987378000000",
        "address": "9701 Northridge Dr, Louisville, KY 40272",
        "price": 179900,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160206170026909993000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160206170026909993000000.jpg"
        ],
        "beds": 4,
        "baths": 3,
        "sqft": 1323,
        "type": "casa",
        "description": "Lovely well kept all brick ranch on walk-out finished basement! Park like setting on .65 acres with creek on back of lot. Extra large detached 3+ car garage and 1 car attached garage. Huge screened porch for entertaining with stack stone half walls! Great flow inside with 2 fireplaces, lots of storage in kitchen and eat-in-dining area with view of trees through large windows!  Must come see this home in a great neighborhood close to schools. One look and you will have to have it!",
        "lat": 38.113358,
        "lng": -85.828042,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160206174709415024000000",
        "address": "5020 Monaco Dr, Louisville, KY 40219",
        "price": 120000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160210144613980457000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160210144613980457000000.jpg"
        ],
        "beds": 3,
        "baths": 2,
        "sqft": 1288,
        "type": "casa",
        "description": "This property has an accepted contract as of 2/11/16 pending release of contingencies. Welcome to 5020 Monaco Drive, only a stone's throw from Hartstern Elementary. This one story BRICK ranch has 3 bedrooms and 2 full baths. There is an extra large room that was used as a family room, but could easily be used as a master bedroom(no closet tho. There is a bathroom in it tho).Exposed HARDWOOD in the bedrooms and in the living room. Hall and the dining area have hardwood under carpet. Backyard is fully fenced and includes a 1 car garage with a roofed patio on it's side. Full basement has new laminate through out and one private room. Home has a pre-listed home inspection please contact the list agent for a copy.",
        "lat": 38.142579,
        "lng": -85.665307,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160206184314704454000000",
        "address": "3606 St. Edwards Dr, Louisville, KY 40299",
        "price": 127000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160206231047962731000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160206231047962731000000.jpg"
        ],
        "beds": 3,
        "baths": 1,
        "sqft": 1140,
        "type": "casa",
        "description": "Hurry!  This home won't last long and is move in ready.  Newly updated three bedroom one bath brick ranch style home in J-Town.  This home is all one level with a driveway on each side.  The kitchen, bath and  flooring throughout have all been updated.  A new exterior storage shed has been added for additional storage.  This home boasts a spacious family room at the entry. It has an eat in kitchen with an  adjoining  laundry room that has its own window.  Off of the kitchen you step down into a large bonus room that could be an additional living area, office or play room.  This room is filled with sunlight and leads onto the back patio and large chain length fenced back yard.   This home has been freshly painted, has a new HVAC system and new electrical wiring throughout.",
        "lat": 38.19345,
        "lng": -85.578449,
        "exclusive": true,
        "city": "Louisville, KY"
    },
    {
        "id": "20200203225038338088000000",
        "address": "6514 Oak Valley Dr, Louisville, KY 40214",
        "price": 235000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20200220013342368366000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20200220013342368366000000.jpg"
        ],
        "beds": 3,
        "baths": 3,
        "sqft": 1491,
        "type": "casa",
        "description": "New listing! This beautiful brick ranch located in the desirable neighborhood of Oak Hills has much to offer. Enter into the foyer where you will find two closets and laminate flooring. Relax in the spacious living room with a fireplace that includes a wood burning insert. New carpet installed as well. The dining room is very open and flows in to the eat in kitchen that has laminate flooring. The white cabinets really brightens up the kitchen and has plenty of built in wall storage. Refrigerator, stove and dishwasher to remain. Laminate flooring in the kitchen as well.  This home offers three Bedrooms and three full baths. The spacious master bedroom includes a ceiling fan, his and her closets and carpet on the floor. The master bathroom includes a stand up shower and a tile floor. The two",
        "lat": 38.157292,
        "lng": -85.819923,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20131207023025484123000000",
        "address": "8303 Lake Superior Dr, Louisville, KY 40291",
        "price": 112500,
        "image": "https://cdn.photos.sparkplatform.com/lou/20140108202931564739000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20140108202931564739000000.jpg"
        ],
        "beds": 3,
        "baths": 2,
        "sqft": 1171,
        "type": "casa",
        "description": "**Conveniently located in the heart of Fern Creek on a cul-de-sac, this 3BR, 1 1/2BA home with attached 1 car garage has much to offer. The main floor is open and airy with an inviting living space and eat-in kitchen. There is plenty of counter space and a large pantry, refrigerator and stove are to remain with home. The main floor also has a half bath and laundry room. Upstairs you will find 3 bedrooms and a large bathroom. Bathroom comes complete with vanity and separate shower room. Enjoy outdoors on the recently refinished deck with scenic natural views.",
        "lat": 38.163405,
        "lng": -85.605007,
        "exclusive": true,
        "city": "Louisville, KY"
    },
    {
        "id": "20160206190731382016000000",
        "address": "7911 Circle Crest Rd, Louisville, KY 40241",
        "price": 275000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160213033305438006000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160213033305438006000000.jpg"
        ],
        "beds": 3,
        "baths": 3,
        "sqft": 2012,
        "type": "casa",
        "description": "This property has an accepted contract as of 2/20/16 pending release of contingencies. beautiful BRICK RANCH with a WALK OUT BASEMENT in the east end. The early morning sun lit up the large family room as I entered. As I looked around I noted a lovely warm fireplace nestled towards the dining room. I could feel all the precious memories and celebrations that filled the rooms as I padded through the house on the thick cream colored carpet. I noticed that the 12 foot front window had a large twin window bathing the dining room in a soft glow. I peeked into the kitchen I noticed there was room for  more than one cook in the kitchen, not to forget a large kitchen island, perfect for a visiting friend to sit and keep the cook company. The Sun room looks to be the best spot to watch the sunset",
        "lat": 38.295844,
        "lng": -85.604314,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160206194444487240000000",
        "address": "10403 Trotters Pointe Dr, 301, Louisville, KY 40241",
        "price": 112000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160207135959040213000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160207135959040213000000.jpg"
        ],
        "beds": 2,
        "baths": 2,
        "sqft": 1083,
        "type": "casa",
        "description": "Outstanding & Oversized 2 Bedroom Condo With 2 Full Bathrooms Located in one of the Most Convenient Areas in Louisville, Close to the Summit/Paddock Shops/Springhurst, Hospital, Interstate, Restaurants. Shopping and More. FHA Approved, New Roof Approved for 2016. Open Floor Plan, Freshly Painted with Neutral Colors, Lots of Natural Light! Everything All On One Level! 3rd Floor Unit has Vaulted Cathedral Ceilings. Large Living Room has Gas Fireplace, Ceiling Fan with Light, Private Balcony. This Room is Open to the Kitchen and Separate Dining Area, which features a modern Chandelier. Kitchen Features a Convection Oven & Stainless Steel Side by Side Refrigerator. Recessed and Pendant Lighting. Each Bedroom has an Oversized Walk-in Closet.",
        "lat": 38.319921,
        "lng": -85.558318,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160207001203963601000000",
        "address": "18608 Treyborne Pl, Louisville, KY 40245",
        "price": 3250,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160207003113574679000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160207003113574679000000.jpg"
        ],
        "beds": 5,
        "baths": 4,
        "sqft": 3463,
        "type": "casa",
        "description": "LOCATED IN LOCUST CREEK. 1ST FLOOR MASTER. 2-STORY GREAT ROOM, DEN/OFFICE, LARGE KITCHEN WITH GRANITE TOPS, PANTRY, LAUNDRY. KITCHEN OPENS TO HEARTH/FAMILY ROOM WITH FIREPLACE. 4 BEDROOMS UPSTAIRS. 3 CAR ATTACHED GARAGE. HARDWOOD FLOORS. COVERED SCREENED PORCH, DECK, OVERLOOKS FENCED BACKYARD. WALKOUT UNFINISHED BASEMENT. PATIO. LOCATED ON A CUL-DE-SAC.LOCUST CREEK HAS POOL, TENNIS, CLUBHOUSE. TENANT PAYS FOR ALL UTILITIES. MUST PROVIDE RENTERS INSURANCE.",
        "lat": 38.236276,
        "lng": -85.424073,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20191011155730564291000000",
        "address": "7001 Broken Bow Dr, Louisville, KY 40258",
        "price": 189000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20191011155731319830000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20191011155731319830000000.jpg"
        ],
        "beds": 4,
        "baths": 2,
        "sqft": 1236,
        "type": "casa",
        "description": "Welcome Home!! A sprawling remodeled ranch located in the Sun Valley neighborhood on a quiet cul-de-sac. Prepared to be amazed when you enter into this gem, there is truly room for everyone to enjoy this home. With the open concept living room and kitchen floor plan this is perfect for large gatherings. Featuring 4 bedrooms and 1.5 bathrooms this house is larger than it looks. The finished basement offers plenty of extra space for a large family room, play room and an office. Outside you will find a fenced yard and a two car garage.",
        "lat": 38.120128,
        "lng": -85.887873,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20140528201625545812000000",
        "address": "2905 Gleeson Ln, Louisville, KY 40299",
        "price": 126000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20140529174950577436000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20140529174950577436000000.jpg"
        ],
        "beds": 3,
        "baths": 2,
        "sqft": 1125,
        "type": "casa",
        "description": "Looking to do minor upgrades in a good area and have instant equity? This is the home for you! Features three bedrooms, two full baths, plenty of space, and, an unfinished basement!",
        "lat": 38.204715,
        "lng": -85.587564,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160207032507123456000000",
        "address": "7905 Nancy Ln, Louisville, KY 40258",
        "price": 66000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160207195039397258000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160207195039397258000000.jpg"
        ],
        "beds": 2,
        "baths": 1,
        "sqft": 899,
        "type": "casa",
        "description": "Check out this adorable, affordable 2 bedroom, 1 bath home with a full privacy fence on a corner lot. New carpeting throughout the home installed in December, 2015 and a new roof just 3 years ago. This home also features a large deck to enjoy and 2 storage sheds. Why pay rent anymore or wait to own your own home? Your start to the American dream is right here!",
        "lat": 38.138893,
        "lng": -85.850968,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160207173224089625000000",
        "address": "10025 Prairie Dr, Louisville, KY 40272",
        "price": 119000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160207205240767572000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160207205240767572000000.jpg"
        ],
        "beds": 4,
        "baths": 2,
        "sqft": 1535,
        "type": "casa",
        "description": "Flippers, first-time homebuyers and anyone looking for a deal, your search maybe over. This home is being sold in ''as is'' condition. Check the square footage, comps in the subdivision and the price for the home and we think you’ll agree this is your next purchase. The home has a large living room that flows into a dining room and eat in kitchen. There are three good-sized bedrooms on the first floor and a full bath all in working order. The lower level is a bit messy and need some cleanup and the second bathroom need some repair. The bones appear to be in good condition. Please note looking at the home to the left there is an incredibly large side yard in addition to the backyard.",
        "lat": 38.107377,
        "lng": -85.839094,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160207175257172518000000",
        "address": "5625 Morrison Ave, Louisville, KY 40214",
        "price": 128900,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160207175259886619000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160207175259886619000000.jpg"
        ],
        "beds": 3,
        "baths": 2,
        "sqft": 1576,
        "type": "casa",
        "description": "Great Location near Iroquois Park! Renovated 1 1/2 story w/Partial Finished basement WATER PROOFED w/ transferrable warranty & 2 car GARAGE! New replacement windows, paint, & carpet! Newly finished hardwood floors! Updated kitchen w/ new maple cabinetry, counter tops, ceramic tile floor, center island w/ breakfast bar opens to Din area! Stove, Refrigerator, & Dishwasher! Beautiful formal living room w/ FIREPLACE &bay window w/ sitting area! Rear fam rm w/ windows galore! 2nd floor offers a huge bdrm w/ a sitting & dressing area w/ a full wall of built ins! bmt w/ 2ND FAM RM, UPDATED 1/2 bath, office & previous 4th BDRM.! 1 YR OLD REPUBLIC ULTIMATE  WARRANTY $49",
        "lat": 38.17058,
        "lng": -85.777421,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160207200139576685000000",
        "address": "108 N Jane St, BSMT, Louisville, KY 40206",
        "price": 750,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160207215543267477000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160207215543267477000000.jpg"
        ],
        "beds": 1,
        "baths": 1,
        "sqft": 0,
        "type": "casa",
        "description": "One bedroom, one full bath basement apartment for rent. Owner occupies main and second floor. Separate entrance for basement unit. Wonderful full kitchen with gas stove, full sized refrigerator and brand new dishwasher. Wood burning stove in living area.  Shared laundry room with owner (basement level). Lighted walkway and floodlights. Fully fenced backyard for pets. Freshly painted. Cable and wifi available at no cost to tenant (tenant provides own cable box if desired).  Owner asks 1/3 of utilities to be paid by tenant (call owner for avg monthly cost). THIS RENTAL IS FOR THE BASEMENT APARTMENT ONLY...NOT THE ENTIRE HOUSE. CALL OWNER DIRECTLY FOR ALL SHOWING REQUESTS. ALL PETS MUST BE PRE-APPROVED BY OWNER, PLUS AN ADDITIONAL NON REFUNDABLE PET DEPOSIT WILL BE PAID TO OWNER FOR CLEANING.",
        "lat": 38.254182,
        "lng": -85.703679,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160207210449247338000000",
        "address": "320 Pencross Pl, Louisville, KY 40223",
        "price": 266000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160207232456306989000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160207232456306989000000.jpg"
        ],
        "beds": 4,
        "baths": 3,
        "sqft": 1837,
        "type": "casa",
        "description": "''This property has an accepted contract as of 2/18/16, pending release of contingencies''\r\nOpen, Spacious and the Perfect Location (be sure to see the pictures)! This walkout Ranch is the perfect family home with a split bedroom floor plan and more than enough room for a growing family (4 bedrooms). Walk in to a large Great Room with Gas fireplace that is open to a formal Dining Area and flows nicely into a large eat-in kitchen with tons of light coming in from a wall of windows. You’ll find a large Master Bedroom Suite with Walk-In Closet and Private Master Math. Also on the 1st floor a separate Laundry Room 2 good size bedrooms and a full bath.. You will LOVE the deck off the kitchen, overlooking the large backyard and the perfect place to relax and entertain with family and friends.",
        "lat": 38.249763,
        "lng": -85.545225,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20200203225109702500000000",
        "address": "2634 Wendell Ave, Louisville, KY 40205",
        "price": 190000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20200203225112103250000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20200203225112103250000000.jpg"
        ],
        "beds": 4,
        "baths": 1,
        "sqft": 1365,
        "type": "casa",
        "description": "This 4 bedroom home has an open floorplan and is in absolutely wonderful condition. The real hardwood floors were recently refinished and shine. The master bedroom, with two nice closets, is located on the opposite side of the house from the other 3 bedrooms for privacy. The large great room walks out to the covered back porch. There are mature trees, a large back yard, renovated kitchen and bathroom, replacement windows, neutral colors and lots of natural light- what's not to love? This is a beautiful house for the money and located so close to expressways, shopping and everything else. Call quickly.",
        "lat": 38.218281,
        "lng": -85.660972,
        "exclusive": true,
        "city": "Louisville, KY"
    },
    {
        "id": "20160207213728930348000000",
        "address": "7701 Chimney Rock Ct, Louisville, KY 40220",
        "price": 180000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160220134514105279000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160220134514105279000000.jpg"
        ],
        "beds": 3,
        "baths": 2,
        "sqft": 1696,
        "type": "casa",
        "description": "Here it is >>>A Wonderful Ranch Home OFFERING a Seamless Floor Plan *** Formal Living Room and Dining Room *** Eat-in Kitchen open to Family Room *** Kitchen OFFERS An Abundance of Cabinetry and Counter Space *** Family Room Features a Fireplace and Great Natural Light *** Three Bedrooms and Two Full Baths *** Huge Unfinished Basement with an Outside Entrance *** Great Curb Appeal and on a Cul de-Sac Extra wide and Long 2.5 Car Garage *** Conveniently Located Call Today For a Visit!",
        "lat": 38.207644,
        "lng": -85.612682,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160207223109048364000000",
        "address": "3202 Poplar View Dr, Louisville, KY 40216",
        "price": 93500,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160207232354779923000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160207232354779923000000.jpg"
        ],
        "beds": 2,
        "baths": 1,
        "sqft": 1189,
        "type": "casa",
        "description": "UPDATES GALORE! The kitchen has been remodeled with new STAINLESS STEEL appliances too! A full DIning Area that will hold a LARGE table~~Glass in Enclosure with screens to enjoy the spring time weather~~2 Nice sized rooms with oversized closets with lights in each closet~~Fully Fenced Yard~~1 car garage but with additional space for your yard items~~Fireplace in Living Room with space for a TV~~Newer roof, HVAC, waterproofed basement and panel box...",
        "lat": 38.18216,
        "lng": -85.849207,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20160207223146348119000000",
        "address": "10607 Ledbury Ct, Louisville, KY 40243",
        "price": 272000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20160208002048113327000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20160208002048113327000000.jpg"
        ],
        "beds": 4,
        "baths": 3,
        "sqft": 2438,
        "type": "casa",
        "description": "Just what you've been looking for!! This is a well-kept 4 Bedroom 2.5 Bath home in the desirable Douglass Hills neighborhood!  The first floor has an inviting Living Room with a vent free high efficiency fire place.  The whole entire home can be heated solely by this! There are some beautiful built-ins as well as a wet bar and a half bath.  The bright kitchen had tons of cabinet and counter space.  Just off the kitchen is a spacious  laundry room with lots of beautiful cabinets to match the kitchen. On the other side of the kitchen is the formal dining room which adjoins a large formal living room.  The possibilities are endless for this room!  Upstairs is the large Master Bedroom with an updated shower and roomy walk-in closet.",
        "lat": 38.239414,
        "lng": -85.56033,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20140103221305751965000000",
        "address": "5209 Firwood Ln, Louisville, KY 40291",
        "price": 130000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20140109184119497994000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20140109184119497994000000.jpg"
        ],
        "beds": 3,
        "baths": 2,
        "sqft": 1026,
        "type": "casa",
        "description": "Many updates on this conveniently located home including; new carpet, new ceramic in baths, NEW STAINLESS STEEL APPLIANCES and MUCH more. THE NEW OWNER WILL ALSO BE ABLE TO ENJOY THE NEW SHINGLES THAT ARE ABOUT TO BE INSTALLED.",
        "lat": 38.171233,
        "lng": -85.579381,
        "exclusive": false,
        "city": "Louisville, KY"
    },
    {
        "id": "20150806144058456961000000",
        "address": "4635 Oak Pointe Dr, Louisville, KY 40245",
        "price": 212000,
        "image": "https://cdn.photos.sparkplatform.com/lou/20150806172353144861000000.jpg",
        "images": [
            "https://cdn.photos.sparkplatform.com/lou/20150806172353144861000000.jpg"
        ],
        "beds": 3,
        "baths": 2,
        "sqft": 1854,
        "type": "casa",
        "description": "Beautiful new listing in desirable neighborhood. This 3 bedroom, 2 full bath house with loads of updates\r\ncould be yours! The spacious living room has vaulted ceilings with a gas fireplace that will keep you\r\nwarm and cozy in the winter. The large open eat- in- kitchen has loads of counter space, new back\r\nsplash and newer appliances. Next to the kitchen you will find a nice size bedroom with neutral carpet.\r\nAn updated full bath with new tile, new granite vanity top, new water saving toilet, and new hardware.\r\nAs you head upstairs you will find a large master bedroom with a walk in closet and large master bath.\r\nThe master bath has a separate jetted tub and shower, a new water saving toilet and new tile. The 3r d\r\nbedroom has lots of storage space in its 2 closets. The bonus room has new",
        "lat": 38.314815,
        "lng": -85.535522,
        "exclusive": false,
        "city": "Louisville, KY"
    }
];

// Usuarios demo para login
export const DEMO_USERS = {
    'gilbert@zhomesre.com': { role: 'broker', name: 'Gilbert R Zaldivar', avatar: '/assets/agents/Gilbert Zaldivar-Broker.png' },
    'valcarceljessy@gmail.com': { role: 'realtor', realtorId: 1, name: 'Jessica Hernandez', avatar: '/assets/agents/Jessica Hernandez.png' },
    'judithgonzalezrealestate@gmail.com': { role: 'realtor', realtorId: 2, name: 'Judith Gonzalez', avatar: '/assets/agents/Judith Gonzalez.png' },
    'realtormiriamcastano@gmail.com': { role: 'realtor', realtorId: 3, name: 'Miriam C Castaño', avatar: '/assets/agents/Miriam Castano.png' },
    'yusleidyrealtor@gmail.com': { role: 'realtor', realtorId: 4, name: 'Yusleidy Perez', avatar: '/assets/agents/Yusleidy Perez.png' },
}

// Transacciones asignadas a Jessica (realtorId: 1) para demo
export const REALTOR_TRANSACTIONS = [
    {
        id: 101, address: '8708 Denise Dr', city: 'Louisville, KY', price: 425000,
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
        status: 'pre_close', statusLabel: 'Pre-Cierre', statusColor: '#10B981',
        daysOnMarket: 48, listDate: '2025-12-28',
        realtorId: 1,
        documents: [
            { name: 'Contrato de Compra-Venta', status: 'approved' },
            { name: 'Disclosure del Vendedor', status: 'approved' },
            { name: 'Inspección de Propiedad', status: 'uploaded' },
            { name: 'Tasación', status: 'pending' },
            { name: 'HUD Statement', status: 'pending' },
            { name: 'Title Insurance', status: 'pending' },
        ],
    },
    {
        id: 102, address: '1850 Lakewood Hills', city: 'Prospect, KY', price: 715000,
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
        status: 'inspection', statusLabel: 'Inspección', statusColor: '#F59E0B',
        daysOnMarket: 22, listDate: '2026-01-23',
        realtorId: 1,
        documents: [
            { name: 'Contrato de Compra-Venta', status: 'approved' },
            { name: 'Disclosure del Vendedor', status: 'uploaded' },
            { name: 'Inspección de Propiedad', status: 'pending' },
            { name: 'Tasación', status: 'pending' },
        ],
    },
    {
        id: 103, address: '7821 Norbourne Ave', city: 'St. Matthews, KY', price: 489000,
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
        status: 'listed', statusLabel: 'Listada', statusColor: '#3B82F6',
        daysOnMarket: 12, listDate: '2026-02-02',
        realtorId: 1,
        documents: [
            { name: 'Contrato de Listado', status: 'approved' },
            { name: 'Disclosure del Vendedor', status: 'pending' },
        ],
    },
    {
        id: 104, address: '220 River Rd', city: 'Anchorage, KY', price: 899000,
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400',
        status: 'under_contract', statusLabel: 'Bajo Contrato', statusColor: '#8B5CF6',
        daysOnMarket: 35, listDate: '2026-01-10',
        realtorId: 1,
        documents: [
            { name: 'Contrato de Compra-Venta', status: 'approved' },
            { name: 'Disclosure del Vendedor', status: 'approved' },
            { name: 'Inspección de Propiedad', status: 'uploaded' },
            { name: 'Tasación', status: 'pending' },
            { name: 'HUD Statement', status: 'pending' },
        ],
    },
    {
        id: 105, address: '3744 Springhurst Blvd', city: 'Louisville, KY', price: 345000,
        image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400',
        status: 'closed', statusLabel: 'Cerrada', statusColor: '#06B6D4',
        daysOnMarket: 60, listDate: '2025-12-16',
        realtorId: 1,
        documents: [
            { name: 'Contrato de Compra-Venta', status: 'approved' },
            { name: 'Disclosure del Vendedor', status: 'approved' },
            { name: 'Inspección de Propiedad', status: 'approved' },
            { name: 'Tasación', status: 'approved' },
            { name: 'HUD Statement', status: 'approved' },
            { name: 'Title Insurance', status: 'approved' },
        ],
    },
]
