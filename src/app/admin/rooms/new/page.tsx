import AdminRoomForm from '@/components/admin/AdminRoomForm';
import BackButton from '@/components/admin/BackButton';

export default function NewRoomPage() {
  return (
    <div className="space-y-6">
      <BackButton href="/admin/rooms" label="Back to Rooms" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Room</h1>
        <p className="mt-2 text-gray-600">Create a new room listing for your hotel</p>
      </div>
      
      <AdminRoomForm isEdit={false} />
    </div>
  );
}
