import FeedbackForm from '@/components/FeedbackForm';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';

const FeedbackFab = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          aria-label="Open feedback chat"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-emerald-700 focus:outline-none"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Give feedback</span>
        </button>
      </DialogTrigger>

      <DialogContent className="right-6 bottom-24 left-auto top-auto translate-x-0 translate-y-0 w-[360px] max-w-[90vw] h-[520px] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">We appreciate your thoughts — send feedback anytime.</DialogDescription>
          </DialogHeader>
          <div className="p-4 overflow-auto flex-1 bg-gradient-to-b from-white/60 to-white/40">
            <FeedbackForm onSuccess={() => setOpen(false)} closeAfterMs={1000} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackFab;
