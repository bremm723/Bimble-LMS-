<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create default branch
        $branch = Branch::create([
            'name' => 'Cabang Pusat',
            'address' => 'Jl. Pendidikan No. 1',
            'phone' => '021-12345678',
            'is_active' => true,
        ]);

        // Create Super Admin
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@bimbel.co.id',
            'password' => bcrypt('password'),
            'role' => 'super_admin',
            'branch_id' => null,
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Create sample Admin Cabang
        User::create([
            'name' => 'Admin Cabang',
            'email' => 'admin.cabang@bimbel.co.id',
            'password' => bcrypt('password'),
            'role' => 'admin_cabang',
            'branch_id' => $branch->id,
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Create sample Tutor
        User::create([
            'name' => 'Tutor Matematika',
            'email' => 'tutor@bimbel.co.id',
            'password' => bcrypt('password'),
            'role' => 'tutor',
            'branch_id' => $branch->id,
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        // Create sample Siswa
        User::create([
            'name' => 'Siswa Contoh',
            'email' => 'siswa@bimbel.co.id',
            'password' => bcrypt('password'),
            'role' => 'siswa',
            'branch_id' => $branch->id,
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
    }
}
