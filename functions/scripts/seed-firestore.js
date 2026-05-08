const admin = require('firebase-admin');

// Configurar para emulador
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('Configurando host del emulador a localhost:8080');
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
}

// Inicializar Firebase
admin.initializeApp({
  projectId: 'demo-no-project'
});

const db = admin.firestore();
const auth = admin.auth();

// Cargar datos de ejemplo
const seedData = require('./seed-data.json');

async function seedFirestore() {
  try {
    // Crear usuarios en Auth + Firestore
    console.log('\n🧑 Creando usuarios...');
    for (const user of seedData.users) {
      // Crear usuario en Auth emulator
      try {
        await auth.createUser({
          uid: user.id,
          email: user.email,
          password: 'password123',
          displayName: user.name,
          photoURL: user.image
        });
        console.log(`  ✔ Auth: ${user.name} (${user.email}) — contraseña: password123`);
      } catch (e) {
        if (e.code === 'auth/uid-already-exists') {
          console.log(`  ⚠ Auth: ${user.name} ya existe, saltando...`);
        } else {
          throw e;
        }
      }

      // Crear documento en Firestore
      const userData = {
        ...user,
        offer: user.offer || [],
        emailNotifications: user.emailNotifications || {
          notifyForumPosts: true,
          notifyNewProjects: true,
          notifyProjectUpdates: true
        },
        createdAt: user.createdAt
          ? new admin.firestore.Timestamp(user.createdAt._seconds, user.createdAt._nanoseconds)
          : admin.firestore.Timestamp.now()
      };
      await db.collection('users').doc(user.id).set(userData);
      console.log(`  ✔ Firestore: ${user.name}`);
    }

    // Cargar proyectos
    console.log('\n📋 Creando proyectos...');
    for (const project of seedData.projects) {
      const projectData = {
        ...project,
        createdAt: new admin.firestore.Timestamp(project.createdAt._seconds, project.createdAt._nanoseconds),
        updatedAt: new admin.firestore.Timestamp(project.updatedAt._seconds, project.updatedAt._nanoseconds)
      };
      await db.collection('projects').doc(project.id).set(projectData);
      console.log(`  ✔ ${project.title} [${project.status}]`);
    }

    // Cargar membresías
    console.log('\n👥 Creando membresías...');
    for (const membership of seedData.project_memberships) {
      const membershipData = {
        ...membership,
        joinedAt: new admin.firestore.Timestamp(membership.joinedAt._seconds, membership.joinedAt._nanoseconds)
      };
      await db.collection('project_memberships').doc(membership.id).set(membershipData);
      const project = seedData.projects.find(p => p.id === membership.projectId);
      const user = seedData.users.find(u => u.id === membership.userId);
      console.log(`  ✔ ${user?.name || membership.userId} → ${project?.title || membership.projectId} (${membership.role}, ${membership.status})`);
    }

    // Cargar posts de discusión
    if (seedData.discussion_posts) {
      console.log('\n💬 Creando posts de discusión...');
      for (const post of seedData.discussion_posts) {
        const postData = {
          ...post,
          createdAt: new admin.firestore.Timestamp(post.createdAt._seconds, post.createdAt._nanoseconds)
        };
        await db.collection('discussion_posts').doc(post.id).set(postData);
        const project = seedData.projects.find(p => p.id === post.projectId);
        console.log(`  ✔ ${post.userName} en "${project?.title || post.projectId}"`);
      }
    }

    console.log('\n✅ Datos cargados correctamente!');
    console.log(`   ${seedData.users.length} usuarios`);
    console.log(`   ${seedData.projects.length} proyectos`);
    console.log(`   ${seedData.project_memberships.length} membresías`);
    console.log(`   ${(seedData.discussion_posts || []).length} posts de discusión`);
    console.log('\n🔑 Todos los usuarios tienen contraseña: password123');
    console.log('📧 Emails:');
    seedData.users.forEach(u => console.log(`   - ${u.email}`));

  } catch (error) {
    console.error('❌ Error al cargar datos:', error);
  }
}

seedFirestore();
