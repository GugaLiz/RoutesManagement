using RM.Common;
using RM.DAL;
using RM.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.ServiceImpl
{
    public interface IHighSpeedTrainService : IBaseService<HighSpeedTrain>
    {
        void Save(HighSpeedTrain item);
        new int Remove(int id);
    }

    public class HighSpeedTrainService : BaseService<HighSpeedTrain>,
        IHighSpeedTrainService
    {
        public HighSpeedTrainService(IDatabase db) : base(db, null)
        {
            this.db = db;
            this.rep = new HighSpeedTrainRepository(db);
        }

        public new void Save(HighSpeedTrain item)
        {
            rep.Add(item);
        }

        public new int Remove(int id)
        {
            return rep.Delete(id);
        }
    }
}
