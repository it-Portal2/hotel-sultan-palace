import AdminRoomForm from '@/components/admin/AdminRoomForm';
import BackButton from '@/components/admin/BackButton';

interface EditRoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function EditRoomPage({ params }: EditRoomPageProps) {
  const { roomId } = await params;
  
  return (
    <div className="space-y-6">
      <BackButton href="/admin/rooms" label="Back to Rooms" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Room</h1>
        <p className="mt-2 text-gray-600">Update room information</p>
      </div>
      
      <AdminRoomForm roomId={roomId} isEdit={true} />
    </div>
  );
}
