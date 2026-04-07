const guardarJugada = async () => {
  setGuardando(true);
  try {
    console.log('user:', user?.uid);
    console.log('grupoId:', grupoId);
    console.log('partidos:', partidos.length);
    console.log('respuestas:', respuestas);

    const prediccionesGuardadas = partidos.map((p: any, i: number) => ({
      local: p.local, visitante: p.visitante, fecha: p.fecha,
      golesLocalPredichos: parseInt(predicciones[i]?.local || '0'),
      golesVisitantePredichos: parseInt(predicciones[i]?.visitante || '0'),
    }));

    const variablesGuardadas: Record<string, any> = {};
    variables.forEach(v => {
      variablesGuardadas[v.key] = v.tipo === 'numero' ? parseInt(respuestas[v.key] || '0') : respuestas[v.key];
    });

    console.log('prediccionesGuardadas:', prediccionesGuardadas);
    console.log('variablesGuardadas:', variablesGuardadas);

    await addDoc(collection(db, 'jugadas'), {
      nombre: nombre.trim(),
      grupoId: grupoId || null,
      userId: user.uid,
      userEmail: user.email,
      variables: variablesGuardadas,
      variablesMeta: variables,
      predicciones: prediccionesGuardadas,
      pagado: false,
      pagadoInterno: false,
      creadoEn: serverTimestamp(),
    });
    router.push(grupoId ? /grupo/${grupoId} : '/inicio');
  } catch (e: any) {
    console.error('Error completo:', e);
    setError(Error: ${e.code} - ${e.message});
  }
  setGuardando(false);