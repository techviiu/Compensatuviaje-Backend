import {PrismaClient} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createFirstSuperAdmin(){
    console.log('Creando superadmin');
    const emailSuperAdmin = process.env.FIRST_SUPER_ADMIN_EMAIL;
    const passwordSuperAdmin = process.env.FIRST_SUPER_ADMIN_PASSWORD;

    if(!emailSuperAdmin || !passwordSuperAdmin){
        console.log('Las credencial no existen para el superadmin'); 
        return;
    }

    try {

        const roleSuperAdmin = await prisma.role.findFirstOrThrow({
            where: {code: 'SUPERADMIN'},
        });

        const hashedPassword = await bcrypt.hash(passwordSuperAdmin, 8);

        const   newUser = await prisma.user.create({
            data: {
                email: emailSuperAdmin,
                name: "Super Administrador",
                passwordHash: hashedPassword,
                isActive: true,

            },
            select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
                createdAt: true
            }
       })

       await prisma.userGlobalRoles.create({
        data: {
            userId: newUser.id,
            roleId: roleSuperAdmin.id
        }
       })
       console.log('SuperAdmin Creado correcatamente y asingnado');
       
       

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error durante la creación de SuperAdmin', error.message);
        } else {
            console.error('Error durante la creación de SuperAdmin', String(error));
        }
        
    }finally{
        await prisma.$disconnect();
    }

    
}

createFirstSuperAdmin();