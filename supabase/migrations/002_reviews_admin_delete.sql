-- Allow admins to delete any review (for moderation)
CREATE POLICY "reviews_delete_admin" ON public.reviews
  FOR DELETE
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );
