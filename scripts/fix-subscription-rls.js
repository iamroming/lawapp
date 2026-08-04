-- Allow users to insert their own subscriptions
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can insert own subscriptions"
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
